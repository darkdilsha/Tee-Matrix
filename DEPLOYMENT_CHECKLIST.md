# Deployment Checklist — Tee Matrix on Render + Vercel

All code changes are done. What follows is dashboard work only you can do.

**Blocked right now, honestly ordered:**

1. ~~Run `supabase_setup.sql`~~ — **DONE 2026-08-22.** `9 passed, 0 failed`, 6 products seeded.
2. **SMS gateway** — blocks every login, slowest thing to provision, start today. See Phase A2.
3. **Deploy to Render** with env vars (Phase C) — 20 minutes once you have keys
4. **Push `.vercelignore`** (Phase D) — closes the public exposure of your admin phone number

Phase A2 (SMS) and Phases C–D (deploy) do not wait on each other. Do both in parallel.

---

## Phase A: External registration (parallel, blocks nothing else)

1. **Razorpay KYC.** Settings → Account Details must read "Activated", not "Submitted". Then
   switch to Live Mode and generate live keys (Settings → API Keys). Copy the secret at once —
   it is shown one time only.

2. **SMS gateway.** Supabase natively supports only **Twilio, Twilio Verify, MessageBird,
   Vonage, and TextLocal** (TextLocal is community-maintained). **MSG91 is not on that list** —
   reaching it requires writing a Send SMS auth hook (an Edge Function), so prefer **Twilio**
   for India unless you have a reason not to.

   Wire it into Supabase → Authentication → Sign In / Providers → Phone. Without it **nobody
   can log in**, including you: the `123456` bypass is deleted.

   **DLT registration is the slowest item on this whole page** and is required by TRAI
   regardless of provider: register as a Principal Entity on any one operator portal (Jio
   TrueConnect, Airtel, VI, BSNL) → Entity ID → Header/sender ID (6 chars, e.g. `TEEMTX`) →
   content template. Roughly a week end to end. **Check the document requirements first** — DLT
   generally wants business registration proof, and if you do not have it yet that, not the SMS
   setup, is your real launch date.

3. **PhonePe merchant UPI VPA.** When issued you get something like `Q1234567890@ybl`. It goes
   into `MERCHANT_UPI_VPA` on Render. This is the merchant-account VPA, not PhonePe Payment
   Gateway — the PG is a second gateway integration and is out of scope for launch.

---

## Phase B: Database (~30 min — do this today)

### B1. Run the migration

Supabase dashboard → SQL Editor → New query. Paste all of `supabase_setup.sql`, Run. Expect
`Success. No rows returned.` — that is what DDL plus seeds looks like, not a sign nothing ran.

Safely re-runnable: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and every
`DROP POLICY IF EXISTS` precedes its create. If it errors partway, fix and run the whole file
again.

**On re-runs only:** the product seed uses `ON CONFLICT (id) DO UPDATE`, so it overwrites price
and stock for `tm-001`..`tm-006` with whatever is in the file. Once you have edited prices in
the Supabase table editor, edit the INSERT block before re-running. This does **not** apply to
the first run against an empty database — there is nothing to overwrite.

### B2. Copy the service-role key

Settings → API → `service_role` (marked secret). Needed for Render in Phase C.

### B3. Verify RLS — DONE 2026-08-22

```bash
node verify_rls.mjs
```

Result: **`9 passed, 0 failed`**. (Expect 9, not 7 — the rewritten script has nine checks.)

### B4. Confirm the catalog — DONE 2026-08-22

Six rows, `size_stock` populated on all of them, and every product's `size_stock` values sum
exactly to its `stock_qty`:

| id | price | stock_qty | size_stock |
|---|---|---|---|
| tm-001 | 1999 | 45 | S 10, M 15, L 12, XL 8 |
| tm-002 | 1899 | 30 | XS 5, S 8, M 10, L 7, XL 0 |
| tm-003 | 1699 | 60 | S 12, M 18, L 20, XL 10, XXL 0 |
| tm-004 | 1799 | 25 | S 6, M 9, L 10, XL 0 |
| tm-005 | 2299 | 18 | M 6, L 8, XL 4 (no S) |
| tm-006 | 1799 | 40 | S 10, M 12, L 10, XL 8 |

Note the size sets differ per product — tm-005 has no `S` at all — so the size selector must be
driven by each product's own `size_stock` keys, not a fixed S/M/L/XL list.

---

## Phase C: API on Render

### C1. Create the Web Service

- New → Web Service → connect the repo
- Name `tee-matrix-api` (never shown to customers)
- Region: closest to your Supabase project (Mumbai for `ap-south-1`)
- Build Command: **empty**
- Start Command: `node server.js`
- Plan: free is fine to test, but **upgrade before real orders** — free sleeps after 15 min
  idle and the next checkout hangs 30–50 s cold-starting, which is exactly when people leave.

### C2. Environment variables

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=<test secret>
RAZORPAY_WEBHOOK_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
SUPABASE_URL=https://gqjpwnxnloltfzpqqipi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from B2>
ALLOWED_ORIGINS=https://tee-matrix.vercel.app
MERCHANT_UPI_VPA=<leave unset until PhonePe issues yours>
```

Start on **test** keys. With `MERCHANT_UPI_VPA` unset the server boots with a warning and UPI
QRs use the placeholder; Razorpay and COD still work.

### C3. Verify

```bash
curl https://<your-render-host>.onrender.com/api/payment-config   # JSON with your key id
curl https://<your-render-host>.onrender.com/server.js            # must be 403
curl https://<your-render-host>.onrender.com/supabase_setup.sql   # must be 403
```

---

## Phase D: Point Vercel at Render

Your public URL does not change.

### D1. Edit `vercel.json`

Replace `REPLACE-WITH-YOUR-RENDER-HOST.onrender.com` with the real hostname from C3.

### D2. Commit and push

```bash
git add vercel.json .vercelignore package.json lib/ tests/ server.js verify_rls.mjs
git commit -m "Proxy /api to Render; stop serving source and audit docs"
git push
```

### D3. Verify

```bash
curl https://tee-matrix.vercel.app/api/payment-config          # same JSON as C3 → proxy works
curl https://tee-matrix.vercel.app/server.js                   # must be 404
curl https://tee-matrix.vercel.app/supabase_setup.sql          # must be 404
curl https://tee-matrix.vercel.app/SECURITY_FIXES_PROMPT.md    # must be 404
```

Those last three return **200 today** and expose your admin phone number. This step is what
closes that.

---

## Phase E: Razorpay webhook

Settings → Webhooks → Add New Webhook.

- **URL:** `https://<your-render-host>.onrender.com/api/razorpay-webhook` — the Render host,
  **not** Vercel. The HMAC is computed over raw request bytes; a proxy in that path risks
  re-encoding the body and breaking every signature check.
- **Secret:** exactly the `RAZORPAY_WEBHOOK_SECRET` from C2
- **Active Events:** `payment.captured` and `order.paid` only (the second is under Order Events)

Register separately in test and live mode, with different secrets.

---

## Phase F: Test-mode checkout

On `https://tee-matrix.vercel.app`, with test keys live:

1. Log in with `+91 8593071292` — **if SMS is not live yet you are blocked here**
2. Add to cart → Razorpay checkout
3. Test card `4111 1111 1111 1111`, any future expiry, any CVV

Then confirm all of:

- Razorpay → Payments shows the transaction
- its **receipt** equals your order id, format `TM-<base36>-<8 hex>`
- `orders` row has `payment_status = 'PAID'`
- `products.size_stock[<size>]` decremented by **exactly one**
- the order appears in your admin panel

If stock did not move: check the Razorpay webhook log returned 200, and re-check B4.

---

## Phase G: Go live

1. Swap Render env vars to live `rzp_live_...` keys
2. Set `MERCHANT_UPI_VPA` to the real PhonePe VPA
3. Register the live-mode webhook with a fresh secret
4. Finish the Supabase phone provider setup
5. Place one ₹1–10 real order and reconcile it **three ways** — order row, Razorpay dashboard,
   and your bank statement. The webhook and the client-side verify are two independent
   settlement paths and both have been wrong before.
6. Retire `tm-001`..`tm-006` if they are not real products

---

## Deliberately not done

- **GST** stays `false` ([server.js:76](server.js:76)). Do not enable it unless you hold a
  GSTIN — collecting GST without remitting it is tax fraud.
- **PhonePe Payment Gateway.** If your registration is the PG rather than a merchant UPI
  account, that is a whole second gateway: its own order route, signature scheme, webhook, and
  settlement stream to reconcile. Razorpay already covers cards, netbanking, wallets and UPI.
- **`ORDER_ID_FIX_PROMPT.md` is already applied** in the code below. If Antigravity reads that
  file, tell it the work is complete — do not let it apply the changes twice.

---

## Code changes already made and tested

- [lib/orderId.js](lib/orderId.js) — new module: `generateOrderId()` (timestamp prefix + 4
  random bytes) and `isUniqueViolation()`, extracted so they are testable without booting the
  server
- [server.js](server.js) — all three order routes now use `generateOrderId()`; the old
  `Date.now().toString().slice(-4)` recycled every 10 seconds and collided around order ~120
- Razorpay route allocates the id **before** the gateway call so it travels as the receipt,
  retries once on collision, and logs orphaned gateway orders with their `razorpay_order_id`
- UPI/COD route uses `insertOrderWithUniqueId` with the same retry
- new `sendOrderFailure` helper — logs the real error, returns a generic message to the client,
  closing the PostgREST disclosure that leaked column and constraint names
- `merchantUpiVpa` now reads `process.env.MERCHANT_UPI_VPA`, so an ephemeral filesystem cannot
  silently revert your VPA to the placeholder
- `data/` creation wrapped in try/catch so a read-only filesystem cannot kill the boot
- non-fatal boot warning when `MERCHANT_UPI_VPA` is unset
- [tests/orderId.test.mjs](tests/orderId.test.mjs) — 7 tests, all passing, including 100,000
  ids all distinct and the exact 10-seconds-apart case
- [verify_rls.mjs](verify_rls.mjs) — now separates `PGRST205` (table absent) from a real
  permissions block, and exits 2 with MIGRATION NOT RUN instead of reporting false passes
- [package.json](package.json) — `"type": "module"`, `engines.node >= 20.6.0`
- [vercel.json](vercel.json) — `/api/*` rewrite to Render (edit the hostname)
- [.vercelignore](.vercelignore) — stops Vercel serving `server.js`, `supabase_setup.sql`,
  `*.md`, `lib/`, `data/`, `.env*`

Verified locally: `node --check` clean, server boots and listens, `/api/payment-config` returns
the env-driven VPA, static allowlist returns 403 for source and docs, unauthenticated
`/api/create-order` returns 401, unsigned webhook returns 401, and all 7 id tests pass.
