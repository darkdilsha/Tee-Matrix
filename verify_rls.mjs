// Tee Matrix — live RLS verification against the real Supabase project.
//   node verify_rls.mjs
// Uses only the public anon key — this is exactly what any visitor can do.
//
// SAFE TO RUN BEFORE OR AFTER the migration. Every write probe is non-destructive:
// the product update writes each row's existing price back to itself (a no-op), the
// order probe deletes itself again, and the stock RPC is called with qty 0. Nothing
// here can damage the catalog even when RLS is still wide open.
//
// A missing table and a locked-down table both answer HTTP 404, so an earlier version of this
// script reported "7 passed" against a database that had no tables at all. Every check now
// inspects the PostgREST error code and refuses to call an absent table secure.

const SUPABASE_URL = 'https://gqjpwnxnloltfzpqqipi.supabase.co';
const ANON_KEY = 'sb_publishable_9pvBeEruDCaGN7tYTY1-JA_Y13NJ-o_';

const H = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' };
let pass = 0, fail = 0;

const ok = (name, detail = '') => { pass++; console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`); };
const no = (name, detail = '') => { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); };

async function req(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H, ...init });
  let body = null;
  try { body = await res.json(); } catch { /* empty body is fine */ }
  return { status: res.status, body, rows: Array.isArray(body) ? body.length : 0 };
}

// PGRST205 = "Could not find the table ... in the schema cache", i.e. the table does not exist.
// 42P01 is the underlying Postgres undefined_table. Neither means "secured".
const isMissingTable = (body) => body?.code === 'PGRST205' || body?.code === '42P01';

// ---------------------------------------------------------------------------
// Preflight: if the schema was never created, nothing below is meaningful.
// ---------------------------------------------------------------------------
console.log('\n=== Tee Matrix live RLS verification (anon key) ===\n');

const preflight = await req('products?select=id&limit=1');
if (preflight.status === 401) {
  console.log('CANNOT VERIFY — the anon key was rejected (HTTP 401).');
  console.log('The key in this file may have been rotated in the Supabase dashboard.\n');
  process.exit(2);
}
if (isMissingTable(preflight.body)) {
  console.log('MIGRATION NOT RUN — public.products does not exist.');
  console.log(`PostgREST says: ${preflight.body.message}\n`);
  console.log('The database is empty, so there is nothing for RLS to protect and nothing');
  console.log('for the storefront to read. Run supabase_setup.sql in the Supabase SQL editor,');
  console.log('then run this script again.\n');
  console.log('Not reporting the checks below as passing: an absent table answers 404 exactly');
  console.log('like a protected one, and calling that a pass is how this went unnoticed.\n');
  process.exit(2);
}

console.log('-- Customer data must be invisible to anonymous callers --');

// Locked down means: a permissions error, or zero rows, to an anonymous caller.
// A missing table is a separate outcome and is never a pass.
async function expectNoRows(table) {
  const { status, body, rows } = await req(`${table}?select=*&limit=5`);
  if (isMissingTable(body)) {
    return no(`${table} DOES NOT EXIST`, 'migration incomplete — this is not protection');
  }
  if (status === 401) return no(`${table} — anon key rejected`, 'HTTP 401');
  if (status >= 400) return ok(`${table} blocked to anon`, `HTTP ${status} ${body?.code || ''}`.trim());
  if (rows === 0) return ok(`${table} returns 0 rows to anon`);
  no(`${table} LEAKS ${rows} row(s) to anon`, JSON.stringify(body[0]).slice(0, 120));
}

for (const t of ['addresses', 'users', 'orders', 'admin_numbers', 'payment_methods']) {
  await expectNoRows(t);
}

console.log('\n-- Catalog must stay publicly readable --');
const catalog = await req('products?select=id,price&limit=10');
catalog.rows > 0
  ? ok('products readable by anon', `${catalog.rows} row(s)`)
  : no('products NOT readable by anon — storefront will be empty', `HTTP ${catalog.status}`);

console.log('\n-- Anonymous writes must all be refused --');

// No-op write: sets a product's price to the value it already has. Proves whether the
// anon role may UPDATE products without altering any data either way.
if (catalog.rows > 0) {
  const probe = catalog.body[0];
  const { status, rows } = await req(`products?id=eq.${encodeURIComponent(probe.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ price: probe.price }),
    headers: { ...H, Prefer: 'return=representation' }
  });
  status >= 400 || rows === 0
    ? ok('anon cannot UPDATE products', status >= 400 ? `HTTP ${status}` : '0 rows changed')
    : no('anon CAN UPDATE PRODUCTS — prices are editable by anyone', `${probe.id} accepted a write`);
} else {
  console.log('  SKIP  product write probe — catalog unreadable');
}

// Insert a throwaway order, then remove it. Proves whether anon may forge paid orders.
const probeId = `rls-probe-${Math.floor(performance.now())}`;
{
  const { status, body } = await req('orders', {
    method: 'POST',
    body: JSON.stringify([{
      id: probeId, phone_number: '+919999999999', customer_name: 'RLS probe',
      address: 'probe', items: [], subtotal: 1, shipping: 0, total: 1,
      payment_status: 'PAID'
    }])
  });
  if (isMissingTable(body)) {
    no('orders table DOES NOT EXIST', 'cannot test order forgery');
  } else if (status >= 400) {
    ok('anon cannot forge a PAID order', `HTTP ${status}`);
  } else {
    no('anon FORGED A PAID ORDER', `HTTP ${status}`);
    const cleanup = await req(`orders?id=eq.${probeId}`, {
      method: 'DELETE', headers: { ...H, Prefer: 'return=representation' }
    });
    console.log(cleanup.rows > 0 || cleanup.status < 400
      ? `        cleaned up probe order ${probeId}`
      : `        COULD NOT clean up ${probeId} — delete it by hand`);
  }
}

console.log('\n-- The SECURITY DEFINER stock function must be unreachable --');
{
  // qty 0 changes no inventory; we only care whether EXECUTE is permitted at all.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/decrement_product_stock`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ p_product_id: 'tm-001', p_size: 'M', p_qty: 0 })
  });
  let body = null;
  try { body = await res.json(); } catch { /* empty body is fine */ }

  // PGRST202 = function not found in the schema cache. That means the migration did not
  // create it, not that EXECUTE was revoked — those are different problems.
  if (body?.code === 'PGRST202') {
    no('decrement_product_stock DOES NOT EXIST', 'migration incomplete — stock will never decrement');
  } else if (res.status === 404 || res.status === 403 || res.status === 401) {
    ok('anon cannot call decrement_product_stock', `HTTP ${res.status}`);
  } else {
    no('decrement_product_stock IS REACHABLE by anon', `HTTP ${res.status} — confirm the REVOKE ran`);
  }
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
if (fail > 0) {
  console.log('\nAny failure means production is either exposed or incomplete right now.');
  console.log('Most likely cause: supabase_setup.sql has not been run, or only partly ran,');
  console.log('in the Supabase SQL editor.\n');
}
process.exit(fail > 0 ? 1 : 0);
