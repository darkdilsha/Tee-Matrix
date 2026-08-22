# Fix: order IDs collide every 10 seconds

One bug, duplicated in two places, plus the error handling around it. Nothing else in the
payment flow changes. The zero-fallback rule from the earlier specs still applies.

---

## The bug

`server.js:508` (`/api/create-razorpay-order`) and `server.js:561` (`/api/create-order`) both
build the order id like this:

```js
const tmOrderId = `TM-${Date.now().toString().slice(-4)}`;
```

The last four digits of the epoch millisecond counter is a space of 10,000 values that
recycles **every 10 seconds**. Two orders placed 10 seconds apart — or 20, or 30 — get the
same id. By the birthday bound, the first collision is likely around the 120th order.

`orders.id` is `TEXT PRIMARY KEY` (`supabase_setup.sql:92`), so the collision does not
corrupt data. It fails the insert:

- `supabaseQuery` throws on any non-2xx (`server.js:144`), so the PostgREST 409 becomes a
  thrown error, caught by the route handler, returned to the customer as HTTP 500 with a raw
  Postgres error string in the body.
- On the Razorpay route the gateway order was already created at `server.js:483`, **before**
  the insert. So a collision leaves an orphaned order at Razorpay that no customer can ever
  pay against, and the customer sees a 500.

Impact is a failed checkout and a lost sale, not lost money — the 500 is returned before the
client receives `key_id`, so the Checkout modal never opens and nothing is charged. Still
needs fixing before volume makes it routine.

---

## 1. One shared id generator

Define it once, near the other helpers at the top of `server.js`. Do not inline it twice.

```js
// Order ids must be unique across the lifetime of the store, not just within a 10s window.
// Time prefix keeps them roughly sortable; the random suffix supplies the actual uniqueness.
function generateOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TM-${stamp}-${rand}`;
}
```

`crypto` is already imported. This yields ids like `TM-M0TLQ8V3-9F2A7C1D` — 4 bytes of
randomness inside the same millisecond, so collisions are not a practical concern.

Replace both `` `TM-${Date.now().toString().slice(-4)}` `` sites with `generateOrderId()`.

**Check the display width.** These ids are longer than the old `TM-1234`. Grep for anywhere an
order id is rendered — order confirmation, order history, the admin dashboard table, any
invoice or WhatsApp/SMS message template — and confirm nothing truncates or is laid out
assuming 7 characters.

## 2. Retry once on the vanishingly unlikely conflict

Wrap the insert so a primary-key conflict retries with a fresh id instead of surfacing a 500.
Apply to both routes.

```js
async function insertOrderWithUniqueId(buildRow) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = generateOrderId();
    try {
      const created = await supabaseQuery('orders', { method: 'POST', body: [buildRow(id)] });
      return { id, row: created ? created[0] : null };
    } catch (err) {
      // 23505 = unique_violation. Anything else is a real failure — do not swallow it.
      if (!String(err.message).includes('23505')) throw err;
      console.warn(`[Orders] id collision on ${id}, retrying`);
    }
  }
  throw new Error('Could not allocate a unique order id after 3 attempts');
}
```

Only a unique-violation retries. A dropped connection, an RLS refusal, or a schema error must
propagate — this must not become a generic swallow-and-retry.

## 3. Stop leaking Postgres errors, and make orphans traceable

Two problems in the current `catch` blocks at `server.js:542` and `server.js:591`. Both apply
to both routes.

**Do not send `err.message` to the client** when it came from `supabaseQuery` — it contains
the raw PostgREST body, which discloses column names, constraint names, and sometimes row
values. Log the detail server-side; return a generic message:

```js
return sendJSON(res, 503, { error: 'Could not create your order. Please try again.' }, req);
```

Keep the existing behaviour for thrown auth objects (`err.status` 401/403) and for
`calculateAuthoritativeOrder` validation failures — those messages are written for the
customer and should still reach them. Only the database-error path gets the generic reply.

**Log the orphan.** On the Razorpay route, if the insert ultimately fails after the gateway
order exists, log at error level with the `razorpay_order_id` so it can be found later:

```js
console.error(`[Orders] ORPHANED Razorpay order ${rzpData.id} — no DB row was written`, err);
```

## 4. Carry the order id into the Razorpay receipt

`server.js:492` sets `receipt: \`rcpt_${Date.now().toString().slice(-6)}\`` — same weak
pattern, and it makes dashboard reconciliation harder than it needs to be. The receipt field
is what shows up next to the payment in the Razorpay dashboard, so put the real order id
there.

This requires generating the id **before** the gateway call, then passing it through to the
insert. Restructure `/api/create-razorpay-order` as:

1. `const tmOrderId = generateOrderId()`
2. Create the Razorpay order with `receipt: tmOrderId`
3. Insert the row with `id: tmOrderId`

Because the id is now fixed before the insert, this route uses the plain insert with that id
rather than `insertOrderWithUniqueId`. On a unique violation here, generate a new id, and
accept that the receipt no longer matches — log the mismatch. Collisions are rare enough that
matching receipts in the normal case is worth more than perfect consistency in the rare one.

Razorpay has a "reject duplicate receipts" setting; if it is ever enabled, unique receipts
become mandatory rather than merely convenient. This change satisfies it either way.

## 5. Tests

Add to the security suite:

- **Uniqueness under load.** Call `generateOrderId()` 100,000 times in a tight loop, collect
  into a `Set`, assert `set.size === 100000`. This is the assertion that would have caught the
  original bug — the old generator fails it immediately.
- **Format.** Assert every generated id matches `/^TM-[0-9A-Z]+-[0-9A-F]{8}$/`.
- **No 10-second recurrence.** Assert `generateOrderId()` called twice with a stubbed clock
  returning timestamps exactly 10,000 ms apart produces different ids. Requires exporting the
  generator, or accepting an optional `now` argument.
- **Conflict retry.** Stub `supabaseQuery` to throw a `23505` error on first call and succeed
  on the second; assert `insertOrderWithUniqueId` returns successfully with a different id and
  that it threw nothing.
- **Non-conflict errors propagate.** Stub `supabaseQuery` to throw a non-23505 error; assert
  `insertOrderWithUniqueId` rethrows rather than retrying.
- **No error disclosure.** Force a DB failure on `/api/create-order` and assert the response
  body contains neither `23505`, nor `constraint`, nor `column`, nor the word `orders`.

Put these in the repo's test file, not in a scratch directory — `scratch/` is gitignored.

---

## Verification

1. Boot the server and place two orders roughly 10 seconds apart. Both succeed, ids differ.
2. `SELECT id, created_at FROM public.orders ORDER BY created_at DESC LIMIT 10;` — all ids
   distinct and in the new format.
3. In the Razorpay dashboard (test mode), confirm the payment's receipt field equals the
   `TM-...` id of the matching row.
4. Confirm the admin dashboard and order-history views render the longer ids without
   truncation.
5. Re-run the full security suite; nothing else regresses.

## Out of scope

Do not change the payment state machine, `settleRazorpayOrder`, the webhook handler, RLS
policies, or the stock decrement logic. This is an id-generation and error-handling fix only.
