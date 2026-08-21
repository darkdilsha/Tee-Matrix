# Tee Matrix — Pre-Launch Security Fix Spec

Paste this into Antigravity as a task. Fixes are ordered by severity. **Do not deploy to
production until Blockers 0–6 are done.**

Rules for whoever implements this:

- Do **not** add a fallback, demo mode, or "if the secret is missing, assume success" path
  anywhere in this document. Every one of these bugs exists because of exactly that pattern.
  If a required credential is absent, the correct behaviour is to **fail loudly**.
- Do **not** mark a task complete because the happy path works. Each blocker below has an
  "Acceptance test" that must actually fail before the fix and pass after.
- Do not change unrelated UI, copy, or styling in this pass.

---

## PREREQUISITE — do this first, it gates Blockers 0 and 1

Real phone OTP auth is not currently working. `js/supabase.js` falls back to a hardcoded
code, which tells me the Supabase phone provider has no SMS gateway attached.

**Before touching the auth code:** in the Supabase dashboard, go to
Authentication → Providers → Phone, enable it, and connect a real SMS provider
(MSG91 or Twilio — MSG91 is usually simpler for Indian numbers and needs DLT template
registration, which takes a few days). Send yourself a real test OTP and confirm it arrives.

This matters because **Blocker 0 and Blocker 1 will lock you out of your own admin panel if
real OTP delivery isn't working yet.** Get SMS working first, then remove the bypass.

---

## BLOCKER 0 — The database is world-writable. Anyone can read every customer's address.

**File:** `supabase_setup.sql:106-114`

```sql
CREATE POLICY "Allow public write access to products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow public access to addresses" ON public.addresses FOR ALL USING (true);
CREATE POLICY "Allow public access to orders" ON public.orders FOR ALL USING (true);
```

`FOR ALL USING (true)` grants the anonymous role full SELECT/INSERT/UPDATE/DELETE. The anon
key is published in `js/supabase.js:5` — it is *supposed* to be public, which means these
policies are the only thing protecting the database, and they protect nothing.

What any visitor can do today with the key from view-source and a browser console:

- Read `public.users` and `public.addresses` → every customer's name, phone, and full home
  address. Under India's DPDP Act this is personal data and this is a reportable breach.
- Read `public.orders` → every order, customer, and total. Also modify order status.
- `DELETE FROM products` → wipe the entire catalog.
- `UPDATE products SET price = 1` → then check out legitimately at ₹1.
- Read `public.admin_numbers` → learn the owner phone `+91 8593071292`, which is step 1 of
  the admin takeover chain in Blocker 1.

**Required fix.** Replace all of `supabase_setup.sql:106-114` with least-privilege policies.
Write them as a new migration that `DROP POLICY IF EXISTS` each old name first, so it can be
re-run safely.

Intended access model:

| Table | Anonymous | Signed-in customer | Admin |
|---|---|---|---|
| `products` | SELECT only | SELECT only | full |
| `users` | none | own row only | full |
| `addresses` | none | own rows only | full |
| `payment_methods` | none | own rows only | full |
| `orders` | none | own rows, INSERT only | full |
| `admin_numbers` | **none** | none | full |

Identify the caller by the phone claim on their session JWT, compared digits-only so that
`+91 8593071292` and `+918593071292` match. Define a helper and use it in the policies:

```sql
CREATE OR REPLACE FUNCTION public.jwt_phone_digits() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT public.jwt_phone_digits() <> ''
     AND EXISTS (
       SELECT 1 FROM public.admin_numbers a
       WHERE regexp_replace(a.phone, '\D', '', 'g') = public.jwt_phone_digits()
     )
$$;
```

Then, for each table, separate SELECT from write instead of using `FOR ALL`, and remember
that INSERT and UPDATE need `WITH CHECK` as well as `USING` — a policy with only `USING`
will not restrict what a row can be changed *to*. For example:

```sql
CREATE POLICY "products public read"  ON public.products FOR SELECT USING (true);
CREATE POLICY "products admin write"  ON public.products FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "addresses own rows" ON public.addresses FOR ALL
  USING (regexp_replace(phone_number, '\D', '', 'g') = public.jwt_phone_digits()
         OR public.is_admin())
  WITH CHECK (regexp_replace(phone_number, '\D', '', 'g') = public.jwt_phone_digits()
         OR public.is_admin());
```

Apply the same shape to `users`, `payment_methods`, and `orders`. For `admin_numbers`, create
**no anonymous policy at all** — only `public.is_admin()`.

**Knock-on change:** `js/supabase.js:95` (`verifyAdminNumber`) currently reads
`admin_numbers` from the browser. Once anonymous read is removed that query returns empty.
Move the admin check to the server as part of Blocker 2, and keep
`AUTHORIZED_ADMIN_NUMBERS` in `js/supabase.js:10` only as a UI hint — never as the actual
gate.

**Acceptance test.** In a private window, with no session, from the browser console:

```js
const { data, error } = await supabase.from('addresses').select('*')
```

Before the fix this returns customer addresses. After the fix it must return `[]` or a
permissions error. Repeat for `users`, `orders`, and `admin_numbers`. Then confirm
`supabase.from('products').select('*')` still works anonymously, and that
`supabase.from('products').delete().eq('id', <any real id>)` fails.

---

## BLOCKER 1 — Hardcoded OTP `123456` authenticates anyone as anyone

**File:** `js/supabase.js:85-89`

```js
const expected = this.activeOTPStore.get(phone) || '123456';
if (cleanToken === expected || cleanToken === '123456') {
  return { success: true, phone, isDevMode: true };
}
```

This block runs *after* the real `supabase.auth.verifyOtp` call fails, so it is not
dev-only — it is the live behaviour in production. Anyone types any phone number and the
code `123456` and they are in.

Chained with Blocker 0, full admin compromise is four steps: read the anon key from
view-source → query `admin_numbers` → get `+91 8593071292` → log in with `123456`.

**Required fix.**

1. Delete the fallback branch at `js/supabase.js:85-89` entirely. `verifySMSOTP` must return
   only what `supabase.auth.verifyOtp` returns, and must surface the real error message on
   failure instead of swallowing it in the `catch` at line 81.
2. Delete the `isDevMode` success path in `sendSMSOTP` around `js/supabase.js:55-62`. If
   Supabase returns an error, propagate it — do not return `success: true` with a demo code
   in the message.
3. Remove `this.activeOTPStore` and every reference to it. A client-side OTP store is not a
   security mechanism; the browser holds both the challenge and the answer.
4. Do not replace this with an environment flag or a `localhost` check. There is no version
   of this fallback that belongs in the shipped bundle — it is client-side code, so any
   condition guarding it can be edited by the person attacking it.

**Acceptance test.** Deployed, in a private window: request an OTP for your own number,
enter `123456` instead of the real code. Before the fix you are logged in; after the fix you
must see an invalid-code error. Then enter the real SMS code and confirm login works.

---

## BLOCKER 2 — `/api/admin/payment-config` has no authentication at all

**File:** `server.js:298`, with `Access-Control-Allow-Origin: *` set at `server.js:89`

There is no auth check on this route. Anyone can repoint your UPI collection address:

```bash
curl -X POST https://<your-domain>/api/admin/payment-config \
  -H 'Content-Type: application/json' \
  -d '{"merchantUpiVpa":"attacker@okaxis"}'
```

Every UPI QR the site generates from then on pays the attacker. Customers pay, get a valid
receipt, and you get nothing and still owe them shirts.

**Required fix.**

1. Require `Authorization: Bearer <supabase_access_token>` on this route. Verify it
   server-side by calling `GET ${SUPABASE_URL}/auth/v1/user` with that bearer token plus the
   `apikey` header. Reject with 401 if the call fails.
2. Take the `phone` from that verified response — never from the request body — and confirm
   it exists in `admin_numbers`, comparing digits-only. Reject with 403 if not. This is also
   where the admin check from Blocker 0 now lives; expose it as
   `GET /api/admin/verify-session` so the admin panel can use it too.
3. Replace the wildcard CORS in `sendJSON` with an explicit origin allowlist from an
   `ALLOWED_ORIGINS` env var (your production domain plus `http://localhost:5173`). Echo
   back the request's `Origin` only when it is on the list. `*` must not ship.
4. Validate `merchantUpiVpa` against `/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/` before saving, and
   reject anything that fails. Right now `server.js:304` does nothing but `.trim()`.
5. Have the admin panel send the current Supabase session token on this call.

**Acceptance test.** Run the curl above against the deployed site with no `Authorization`
header — it must return 401 and `data/payment_config.json` must be unchanged. Repeat with a
valid *non-admin* customer token — must return 403. Repeat with an admin token — must
succeed.

---

## BLOCKER 3 — Payment verification returns `PAID` for fabricated IDs

**File:** `server.js:229-245`

The HMAC comparison sits inside `if (keySecret)`. If `RAZORPAY_KEY_SECRET` is not set in the
production environment, the route falls straight through to `server.js:247` and returns
`{ success: true, verified: true, status: 'PAID' }` for any two strings the client invents.
Free orders, and the failure is silent — nothing in the logs looks wrong.

**Required fix.**

1. Read `RAZORPAY_KEY_SECRET` once at startup. If it is missing, refuse to start the server
   with a clear fatal error, rather than discovering it mid-checkout.
2. Delete the `if (keySecret)` wrapper. The signature check is unconditional. Missing
   signature → 400. Mismatch → 400 and do not mark the order paid.
3. Compare with `crypto.timingSafeEqual` on equal-length buffers, not `!==`.
4. Do not trust `razorpay_order_id` from the body alone. Confirm it matches an order this
   server created, and that its amount equals what you calculated in Blocker 4 — otherwise a
   real ₹1 payment can be replayed against a ₹2,000 order.

**Acceptance test.**

```bash
curl -X POST https://<your-domain>/api/verify-razorpay-payment \
  -H 'Content-Type: application/json' \
  -d '{"razorpay_order_id":"order_fake","razorpay_payment_id":"pay_fake","razorpay_signature":"deadbeef"}'
```

Must return 400 and must never contain `"status":"PAID"`. Also unset the secret and confirm
the server refuses to boot instead of accepting payments.

---

## BLOCKER 4 — Order totals are calculated from prices the browser supplies

**File:** `server.js:141-147`

```js
// Calculate server-side total from verified product prices
const unitPrice = Number(item.price) || 0;
```

The comment says verified; nothing is verified. `item.price` arrives in the request body, so
editing one number in the checkout payload buys a ₹2,000 tee for ₹1 — and because the
Razorpay order is then *created* for ₹1, the signature in Blocker 3 validates correctly. The
payment is genuinely, cryptographically valid. It is just for the wrong amount.

**Required fix.**

1. Accept only `{ id, size, qty }` per line item from the client. Ignore any `price`,
   `name`, or `total` in the body — do not read those fields at all.
2. Look up authoritative prices server-side from `public.products`:
   `GET ${SUPABASE_URL}/rest/v1/products?id=in.(...)&select=id,price,stock_qty,in_stock`.
   Use a service-role key held in `SUPABASE_SERVICE_ROLE_KEY`, server-side only — it must
   never appear in `js/` or in any client bundle.
3. If any submitted `id` is missing from the result, reject the whole order with 400. Do not
   skip the line or treat it as ₹0.
4. Clamp `qty` to a sane integer range and reject quantities exceeding `stock_qty`.
5. Compute the total only from database prices, then apply shipping and (only if
   `enableGST`) tax. Return the computed total so the UI can display it — but treat the
   server value as authoritative if the client disagrees.
6. Note the data dependency: `js/supabase.js:183` upserts admin-created products to
   Supabase, but the hardcoded `INITIAL_PRODUCTS` in `js/store.js` may never have been
   written there. Back-fill `INITIAL_PRODUCTS` into `public.products` before enabling this,
   or the base catalog becomes unbuyable the moment lookups go live. Verify the row count
   matches the catalog before shipping.

**Acceptance test.** Intercept the checkout request, change a line item's `price` to `1`,
and send it. The created Razorpay order must still be for the real catalog price. Then send
a payload containing a product `id` that does not exist — must be a 400, not a discount.

---

## BLOCKER 5 — Demo mode issues fake orders that look successful

**File:** `server.js:196-208`

With no `RAZORPAY_KEY_SECRET`, this returns a synthetic `order_mock_*` id and
`success: true`. Combined with Blocker 3, a customer completes checkout, sees a confirmation,
and no money moves. You would only discover it by reconciling the bank statement.

**Required fix.** Delete the `else` branch. If Razorpay credentials are absent, return 503
with a clear operator-facing error and log it. Remove the `isDemo` flag and any client code
branching on it — grep for `isDemo` and `order_mock` and remove every reference. Also remove
the `'rzp_test_TSNOwRfNZPmZmS'` default at `server.js:25` and the placeholder fallbacks at
`server.js:116-118`; keys come from the environment or the request fails.

**Acceptance test.** Grep the repo for `isDemo`, `order_mock`, and `rzp_test_` — all must
return nothing. Confirm the deployed site is running live Razorpay keys, not test keys.

---

## BLOCKER 6 — Source code, config, and git history are downloadable

**File:** `server.js:322`

```js
let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);
```

The raw request path is joined with no normalization and no check that the result stays
inside the project. `GET /server.js`, `GET /data/payment_config.json`, and `GET /.git/config`
all serve, and `/.git/` exposes the full commit history. Traversal sequences are not
stripped either.

**Required fix.**

1. `decodeURIComponent` the path, then `path.normalize` it, then resolve it and verify with
   `resolved.startsWith(path.resolve(__dirname) + path.sep)`. Reject with 403 otherwise.
   (This also fixes a real bug: `assets/` contains `luffy 1.jpeg` and a `Lufy graphics`
   folder, and without decoding, any path with a space 404s into the SPA fallback.)
2. Serve only from an explicit allowlist of directories — `assets/`, `js/`, `styles/` — plus
   `index.html`. Deny everything else, including `server.js`, `data/`, `*.sql`, `*.md`, and
   any dotfile or dot-directory.
3. Only fall back to `index.html` for extensionless paths. A missing `.js` or `.jpg` must
   return a real 404 with the correct status, not HTML with a 200 — the current behaviour at
   `server.js:329` masks broken asset paths and makes them very hard to debug.
4. Add a `.gitignore` — there is none — containing at least `.env`, `.env.*`, `data/`,
   `node_modules/`, `*.log`. Confirm `data/payment_config.json` is not already tracked
   (`git ls-files data/`); if it is, `git rm --cached` it.

**Acceptance test.** Against the deployed site, `curl -i` each of `/server.js`,
`/data/payment_config.json`, `/.git/config`, and `/supabase_setup.sql` — all must be 403 or
404 with no file contents. Confirm `/assets/hero_banner.jpg` still loads and that a
made-up `/assets/nope.jpg` returns status 404, not 200.

---

## HIGH — Razorpay webhook signature can never validate

**File:** `server.js:263-293`

Two problems. The HMAC at `server.js:270` runs over `JSON.stringify(body)` — a
re-serialization of already-parsed JSON. Razorpay signs the exact bytes it sent, and
re-encoding changes key order and whitespace, so this comparison will essentially always
fail. And verification is skipped entirely when `webhookSecret` or the signature header is
absent (`server.js:269`), so unsigned requests are processed as genuine.

**Fix.** Capture the raw request body as a `Buffer` for this route *before* any JSON parsing,
and HMAC those exact bytes. Require both the secret and the `x-razorpay-signature` header —
reject with 401 if either is missing. Use `crypto.timingSafeEqual`. Make the handler
idempotent by payment id, since Razorpay retries. Right now `server.js:283-286` only logs on
`payment.captured` and never updates the order, so a customer who closes the tab
mid-payment has a paid order stuck unfulfilled — persist the status change.

---

## HIGH — Admin panel gate is a client-side boolean, with a plaintext default password

**Files:** `js/admin.js:19`, `js/store.js:900`

```js
this.isAuthenticated = localStorage.getItem('tm_admin_auth') === 'true';
{ username: "admin", name: "Master Administrator", password: "admin123", role: "Super Admin" }
```

`localStorage.tm_admin_auth = 'true'` in devtools opens the dashboard. Separately, admin
credentials are stored in plaintext in localStorage with a guessable default.

**Fix.** Gate admin rendering on a server-verified session — call the
`GET /api/admin/verify-session` endpoint from Blocker 2 and render on its response, not on a
localStorage flag. Delete the `admin`/`admin123` seed and the whole plaintext admin-account
store in `js/store.js:900-940`; `admin_numbers` plus phone OTP is already the real
mechanism, so the parallel password system should go rather than be patched.

Accept that a static SPA can never truly hide the admin UI — treat the client gate as
cosmetic and make sure **every** privileged action is enforced server-side and by the RLS
policies from Blocker 0. That is what actually protects the data.

---

## Two things that are already correct — don't "fix" these

- The privacy policy claim at `js/policies.js:281` that you never store raw card numbers is
  accurate. Razorpay's hosted checkout handles card data; it never reaches your server. Keep
  it that way — do not add a custom card form later.
- The publishable Supabase key at `js/supabase.js:5` is *meant* to be in client code. Do not
  try to hide it or move it to the server. It is safe **only** once Blocker 0 is done,
  because RLS is what makes it safe.

---

## Operational items no code change can cover

- `enableGST` is `false` at `server.js:27`, which is right unless you are actually
  GST-registered. Only turn it on if you are, since a GST breakdown on an invoice asserts
  registration.
- UPI UTR numbers are customer-typed and trivially faked. Keep checking your bank statement
  against every `PENDING_VERIFICATION` order before dispatch. The UTR field is a
  convenience, not proof of payment.
- Razorpay KYC (PAN, bank account, business proof) and a real merchant UPI VPA are external
  dependencies with multi-day turnarounds. `teematrix@okaxis` at `server.js:23` is a
  placeholder and will fail. Start these in parallel with the code work — they, plus the SMS
  provider in the Prerequisite, are the actual launch bottleneck.

---

## Final pre-deploy checklist

- [ ] Prerequisite: real SMS OTP arrives on a test phone
- [ ] Blocker 0: anonymous `select('*')` on `addresses`, `users`, `orders`, `admin_numbers` all return nothing
- [ ] Blocker 1: `123456` is rejected; real OTP works
- [ ] Blocker 2: unauthenticated config POST returns 401; non-admin token returns 403
- [ ] Blocker 3: forged signature returns 400; server refuses to boot without the secret
- [ ] Blocker 4: tampered client price does not change the charged amount
- [ ] Blocker 5: no `isDemo` / `order_mock` / `rzp_test_` anywhere in the repo
- [ ] Blocker 6: `/server.js`, `/.git/config`, `/data/*` all blocked; `.gitignore` exists
- [ ] Webhook verifies against raw bytes and persists paid status
- [ ] Admin gate is server-verified; `admin123` is gone
- [ ] One end-to-end order with live keys and a real ₹1–10 payment, reconciled against the
      Razorpay dashboard and your bank statement
