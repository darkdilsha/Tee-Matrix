# Addendum to the Security Fix Plan — required before implementation

The plan is approved **except** for the six items below. Items 1 and 2 are correctness
changes to the plan's scope; 3–6 close gaps in it. Apply these on top of the existing plan,
don't restart it.

The zero-fallback rule from the original spec still applies to everything here.

---

## 1. Move order creation server-side — the plan currently leaves order records forgeable

**The gap.** Blocker 4 fixes what the customer is *charged*. It does not fix what gets
*recorded*. `js/store.js:749` (`createOrder`) builds the order in the browser and
`js/supabase.js:327` upserts it directly into `public.orders` with the anon key.

Under the plan's own proposed RLS — "orders: caller's own rows SELECT/INSERT" — a customer
can still insert an order row with any `total` and any `status` they choose, including one
marked paid with no payment at all. `js/store.js:891` lets them update it afterward too. The
Razorpay charge is correct and the order of record is fiction.

This also fills a hole in the plan's Blocker 3, which promises to "validate against
server-created order IDs" without saying where those are stored. The server has no order
store today. This change creates one.

### 1a. Schema

Add to `public.orders`:

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status      TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  ADD COLUMN IF NOT EXISTS payment_method      TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_rzp_order_id_key
  ON public.orders (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_rzp_payment_id_key
  ON public.orders (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
```

Keep the existing `status` column for fulfilment state (Processing / Shipped / Delivered).
`payment_status` is money state and is written **only** by the server. Do not conflate them.

Allowed `payment_status` values, and nothing else: `PENDING_PAYMENT`, `PAID`,
`PENDING_VERIFICATION` (UPI, awaiting your manual UTR check), `COD_PENDING`, `FAILED`.

### 1b. RLS change

Revise the plan's `orders` policy. The client gets **SELECT on its own rows only** — no
INSERT, no UPDATE, no DELETE policy for `anon` or `authenticated`. The server writes with
`SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS, so it is unaffected.

### 1c. All three checkout paths must route through the server

There are three `store.createOrder` call sites — `js/cart.js:591`, `js/cart.js:662`, and
`js/cart.js:711` — corresponding to Razorpay, UPI QR, and COD. **All three** currently
create the order in the browser. If you remove the client's INSERT permission without
covering all three, UPI and COD checkout break silently. Confirm which site is which before
editing.

- `POST /api/create-razorpay-order` — after computing the authoritative total (Blocker 4),
  insert the order row with `payment_status = 'PENDING_PAYMENT'` and the returned
  `razorpay_order_id`, then return your own order id to the client.
- `POST /api/create-order` (new) — for UPI QR and COD. Same server-side price lookup and
  stock validation as Blocker 4; ignore any client-sent price. Set `payment_status` to
  `PENDING_VERIFICATION` for UPI or `COD_PENDING` for COD.
- `POST /api/submit-upi-utr` (new) — accepts an order id plus the customer-entered UTR and
  stores it. It must **not** change `payment_status`. A self-reported UTR is not proof of
  payment; only your manual bank-statement check promotes the order, from the admin panel.

### 1d. Client changes

- `js/supabase.js:311` (`saveOrder`) — delete it. Remove the calls at `js/store.js:806`,
  `js/store.js:869`, and `js/store.js:891`.
- `js/store.js:749` (`createOrder`) — becomes a thin call to the server route, returning the
  server's order id. It must not compute or send totals.
- Keep the client's order-history read (`js/supabase.js:336`) — SELECT-own still works.

### 1e. Verification

Signed in as a normal customer, from the browser console:

```js
await supabase.from('orders').insert([{ id: 'forged-1', phone_number: '<your phone>',
  customer_name: 'x', address: 'x', items: [], subtotal: 1, shipping: 0, total: 1,
  payment_status: 'PAID' }])
```

Must fail with a permissions error. Then run the same as an `update` on a real order of
yours setting `payment_status: 'PAID'` — must also fail. Then complete a genuine checkout and
confirm the row was created by the server with the correct total.

---

## 2. Startup validation: delete "or log fatal error"

The plan says *"Fail server boot **or log fatal error** if required payment keys are
missing."* The second half is an escape hatch and reintroduces exactly Blockers 3 and 5 —
a server that logs a warning and then serves checkout is the bug we are fixing.

Required behaviour: if `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
`SUPABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY` is missing, print which ones and exit
non-zero. The process must not reach `listen()`.

---

## 3. The RLS test must run against the live database, not the SQL file

Test 1 in the plan says "verify SQL migration syntax, policy definitions." That reads like a
static check of `supabase_setup.sql`, which proves nothing.

Two things to be explicit about:

- **Editing `supabase_setup.sql` does not change the database.** The migration has to be
  pasted into the Supabase SQL editor and run by hand. Antigravity cannot apply it. Until
  someone runs it, production is exactly as open as it is now — and a test that greps the
  file will report green the whole time. Call this out as a manual step in the final
  checklist, not an automated one.
- `CREATE POLICY` errors if the policy name already exists, so a partial run can abort
  halfway and leave the old permissive policies live. Put every `DROP POLICY IF EXISTS`
  first, and make the whole migration safely re-runnable.

The automated test must connect with the **anon** key and assert that `select('*')` on
`addresses`, `users`, `orders`, and `admin_numbers` each return empty or a permissions error,
and that anonymous `delete` / `update` on `products` fails. Re-run it after applying the
migration, and treat that run as the gate.

---

## 4. The webhook fix is missing the half that matters

The plan does raw-byte HMAC verification, which is correct, but says nothing about persisting
the result. `server.js:283` currently only `console.log`s. Verifying a signature and then
discarding the event leaves the original bug: a customer whose tab closes mid-payment has a
real payment and an order stuck at `PENDING_PAYMENT` forever.

On a verified `payment.captured` / `order.paid`, look the order up by `razorpay_order_id`,
confirm the webhook amount equals the stored total, and set `payment_status = 'PAID'` with
the `razorpay_payment_id`. Razorpay retries, so make it idempotent — the unique index on
`razorpay_payment_id` from 1a plus an "already PAID, return 200" early exit is enough. Never
transition `PAID` back to a pending state.

---

## 5. Removing the admin-account methods will break the dashboard

The plan deletes `getAdminAccounts` / `addAdminAccount` / `verifyAdminLogin` from
`js/store.js`, but they are called at `js/admin.js:631` and `js/admin.js:751` — there is an
Admin Accounts management UI that renders a password table (`js/admin.js:653`). Delete that
entire dashboard section and its handlers too, or admin render throws on load. Grep for all
call sites before removing the methods; do not leave a stub that returns `[]`.

---

## 6. Additions to the test suite

- **403 case for Blocker 2.** The plan tests unauthenticated → 401. Also test a valid
  *non-admin customer* token → 403. That distinction is the whole point of the admin check.
- **Boot refusal.** Start the server with `RAZORPAY_KEY_SECRET` unset and assert it exits
  non-zero without listening. This is what keeps item 2 from silently regressing.
- **Client cannot write orders.** The two assertions from 1e, as automated tests.
- **Idempotent webhook.** Deliver the same signed `payment.captured` payload twice and assert
  exactly one `PAID` transition and no duplicate row.

---

## Unchanged from the original spec

Everything else in the plan stands as written, including the manual/operational items:
Supabase phone provider with a real SMS gateway before Blockers 0 and 1 go live (or you lock
yourself out), Razorpay KYC and a real merchant VPA, GST left off unless registered, and one
end-to-end live order reconciled against both the Razorpay dashboard and your bank statement
before you announce the site.
