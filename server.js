// TEE MATRIX - Production-Ready HTTP Dev & Payment API Server
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { generateOrderId, isUniqueViolation } from './lib/orderId.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  } catch (e) {
    console.warn('Could not read .env file:', e.message);
  }
}

const PORT = process.env.PORT || 5173;

// ===================================================
// 1. Startup Fail-Fast Credential Validation
// ===================================================
const REQUIRED_ENV_VARS = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = REQUIRED_ENV_VARS.filter(key => !process.env[key] || !process.env[key].trim());
if (missingEnvVars.length > 0) {
  console.error('\n[ENVIRONMENT NOTICE] The following required environment variables are not set:');
  missingEnvVars.forEach(v => console.error(`  - ${v}`));
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.error('Please configure all required environment variables in .env before starting.\n');
    process.exit(1);
  }
}

// MERCHANT_UPI_VPA is a warning rather than a boot failure: Razorpay and COD checkout work
// without it. Only the direct-UPI QR path depends on it, so the store can launch on the other
// two methods while a merchant VPA is still being issued.
if (!process.env.MERCHANT_UPI_VPA || !process.env.MERCHANT_UPI_VPA.trim()) {
  console.warn('\n[WARNING] MERCHANT_UPI_VPA is not set. Direct UPI QR codes will use the');
  console.warn('placeholder VPA, which you do not own — those payments cannot reach you.');
  console.warn('Set MERCHANT_UPI_VPA, or disable the UPI option, before taking real orders.\n');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Authorized Administrator Emails (Configured via ADMIN_EMAILS env or default official support emails)
const DEFAULT_ADMIN_EMAILS = [
  'teematrixsupport@gmail.com',
  'dilshad29052003@gmail.com'
];
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(','))
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

// Ensure local data directory exists for config persistence.
// Hosts with a read-only filesystem must still boot: config then falls back to the
// env-driven defaults below and admin edits are held in memory only.
const DATA_DIR = path.join(__dirname, 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn(`[Config] Cannot create ${DATA_DIR} (${err.code}). Payment config will not persist.`);
}

const CONFIG_FILE = path.join(DATA_DIR, 'payment_config.json');

// Default initial payment configuration.
// MERCHANT_UPI_VPA must be set in the host environment. Deploy targets with an ephemeral
// filesystem wipe payment_config.json on every redeploy, so this env var — not the file — is
// what keeps UPI QRs pointed at the real merchant account.
const DEFAULT_PAYMENT_CONFIG = {
  merchantUpiVpa: process.env.MERCHANT_UPI_VPA || 'teematrix@okaxis',
  merchantName: 'Tee Matrix',
  enableCOD: true,
  enableGST: false,
  gstRate: 0.12
};

function getPaymentConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_PAYMENT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    }
  } catch (_) {}
  return { ...DEFAULT_PAYMENT_CONFIG };
}

function savePaymentConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving payment config:', err);
  }
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || `http://localhost:${PORT},http://127.0.0.1:${PORT}`)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function getCorsOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return null;
}

function sendJSON(res, statusCode, data, req = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Razorpay-Signature'
  };
  if (req) {
    const matchedOrigin = getCorsOrigin(req);
    if (matchedOrigin) {
      headers['Access-Control-Allow-Origin'] = matchedOrigin;
    }
  }
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}

// Helper to read and capture raw buffer and parsed JSON request body
function parseBodyWithRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    req.on('data', chunk => {
      chunks.push(chunk);
      totalLength += chunk.length;
      if (totalLength > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      const rawBuffer = Buffer.concat(chunks);
      const rawString = rawBuffer.toString('utf8');
      if (!rawString) return resolve({ parsed: {}, rawBuffer, rawString });
      try {
        const parsed = JSON.parse(rawString);
        resolve({ parsed, rawBuffer, rawString });
      } catch (err) {
        resolve({ parsed: {}, rawBuffer, rawString });
      }
    });
    req.on('error', reject);
  });
}

// Supabase REST Helper using service-role key (bypasses RLS for secure server operations)
async function supabaseQuery(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {})
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase query error (${res.status}): ${errText}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  return null;
}

// Order ids must be unique across the whole life of the store. The previous scheme used the
// last four digits of Date.now(), a 10,000-value space that recycles every 10 seconds, so two
// orders placed 10s apart collided and the second insert failed on the primary key.
// generateOrderId and isUniqueViolation live in lib/orderId.js so they stay unit-testable.

// Retries only on an id collision. Any other failure — dropped connection, RLS refusal,
// schema mismatch — must propagate untouched rather than being retried blindly.
async function insertOrderWithUniqueId(buildRow) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = generateOrderId();
    try {
      const created = await supabaseQuery('orders', { method: 'POST', body: [buildRow(id)] });
      return { id, row: created ? created[0] : null };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      lastErr = err;
      console.warn(`[Orders] Order id collision on ${id}, retrying with a new id`);
    }
  }
  throw lastErr || new Error('Could not allocate a unique order id after 3 attempts');
}

// Supabase/PostgREST error text names columns, constraints and sometimes row values. It is
// useful in logs and must never reach the client. Auth rejections and the price/stock
// validation messages are written for customers, so those still pass through.
function sendOrderFailure(res, req, err, context) {
  console.error(`[Orders] ${context}:`, err);
  if (err && err.status) {
    return sendJSON(res, err.status, { error: err.message || 'Request rejected' }, req);
  }
  return sendJSON(res, 503, { error: 'Could not create your order. Please try again.' }, req);
}

// Customer Auth Verification via Supabase /auth/v1/user
async function verifyCustomer(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: 'Missing Authorization Bearer token' };
  }
  const token = authHeader.substring(7).trim();
  if (!token) {
    throw { status: 401, message: 'Empty Bearer token' };
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  if (!userRes.ok) {
    throw { status: 401, message: 'Invalid or expired user session' };
  }

  const user = await userRes.json();
  // Only the top-level `phone` and `email` claims are trustworthy. user_metadata
  // (raw_user_meta_data) is client-writable via supabase.auth.updateUser({ data: {...} }) with
  // nothing but the publishable key, so reading an identity from it would let any session claim
  // any identity — including a seeded admin number. jwt_phone_digits() in the DB reads only
  // auth.jwt()->>'phone' for exactly this reason, and every request here uses the service-role
  // key, so RLS never gets a chance to reject a forged identity. Keep this in sync with the DB
  // helper.
  //
  // A session must prove one of the two. Phone OTP sessions carry a verified phone and no email;
  // Google sessions carry a verified email and no phone. `email_confirmed_at` is set by GoTrue,
  // not by the client, so it is as server-verified as the phone claim. The Supabase user id is
  // what actually identifies the account downstream — the phone on an order is a delivery
  // contact typed into the checkout form, not an identity.
  const rawPhone = user.phone || '';
  const phoneDigits = rawPhone.replace(/\D/g, '');
  const email = (user.email || '').trim().toLowerCase();
  const emailVerified = !!email && !!(user.email_confirmed_at || user.confirmed_at);
  if (!phoneDigits && !emailVerified) {
    throw { status: 401, message: 'No verified phone number or email found on authenticated session' };
  }
  if (!user.id) {
    throw { status: 401, message: 'Authenticated session is missing a user id' };
  }

  const provider = (user.app_metadata && user.app_metadata.provider) || (phoneDigits ? 'phone' : 'email');

  return { user, userId: user.id, phone: rawPhone, phoneDigits, email, provider, token };
}

// Admin Auth Verification (Supports verified Admin Email / Gmail OAuth AND Phone OTP)
async function requireAdmin(req) {
  const auth = await verifyCustomer(req);

  // 1. Check Email-based Admin Authentication (Google OAuth / Verified Admin Email)
  if (auth.email) {
    const isEmailAdmin = ADMIN_EMAILS.includes(auth.email.toLowerCase());
    if (isEmailAdmin) {
      return { ...auth, role: 'Super Admin', adminIdentifier: auth.email };
    }
  }

  // 2. Check Phone-based Admin Authentication (Phone OTP)
  if (auth.phoneDigits) {
    const admins = await supabaseQuery('admin_numbers?select=*');
    const isPhoneAdmin = Array.isArray(admins) && admins.some(a => (a.phone || '').replace(/\D/g, '') === auth.phoneDigits);
    if (isPhoneAdmin) {
      return { ...auth, role: 'Super Admin', adminIdentifier: auth.phone };
    }
  }

  throw { status: 403, message: `Access denied: '${auth.email || auth.phone}' is not an authorized administrator.` };
}

// Atomic stock decrement helper via Supabase stored procedure
async function decrementStockRpc(productId, size, qty) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/decrement_product_stock`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_product_id: productId,
        p_size: size,
        p_qty: qty
      })
    });
    if (!res.ok) {
      console.error(`Stock decrement RPC error for product ${productId}:`, await res.text());
      return false;
    }
    const success = await res.json();
    return success === true;
  } catch (err) {
    console.error(`RPC invocation error for product ${productId}:`, err);
    return false;
  }
}

// The checkout form collects street, city and pincode as required fields, but only the street line
// was ever written to orders.address — so an order arrived at the merchant with no city and no
// pincode and could not actually be posted. There is no separate city/pincode column, so the parts
// are composed into the single address column here.
//
// The old `|| 'Direct Delivery'` fallback is gone deliberately: capturing money for an order with a
// placeholder address produces a paid, unshippable order. A missing address is now a 400 at
// checkout, before any payment is initiated.
function composeShippingAddress(shippingInfo) {
  const get = (k) => (shippingInfo?.[k] || '').toString().trim();
  const street = get('address');
  const city = get('city');
  const zip = get('zip') || get('pincode');

  const missing = [];
  if (!street) missing.push('street address');
  if (!city) missing.push('city');
  if (!zip) missing.push('pincode');
  if (missing.length > 0) {
    throw { status: 400, message: `Shipping address is incomplete — missing ${missing.join(', ')}` };
  }

  const state = get('state');
  return [street, city, state, zip].filter(Boolean).join(', ');
}

// Delivery phone for the order row.
//
// This used to be auth.phone — the verified OTP claim — which worked only because the only way to
// log in was SMS. A Google session has no phone claim, and orders.phone_number is NOT NULL, so the
// number now comes from the checkout form (#shipPhone, already `required` client-side).
//
// That makes it ordinary user input rather than a verified claim, so it is validated here: it is
// the merchant's only way to reach the buyer about a delivery, and an unusable number means a paid
// order that cannot be fulfilled. The verified claim is still preferred as a fallback for phone-OTP
// sessions that don't send one.
function resolveDeliveryPhone(shippingInfo, auth) {
  const typed = (shippingInfo?.phone || '').toString();
  const raw = typed.replace(/\D/g, '') || auth.phoneDigits || '';

  // Accept 10-digit local, 91-prefixed (12), or 0-prefixed (11) forms and normalise to 10 digits.
  let digits = raw;
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw {
      status: 400,
      message: 'A valid 10-digit Indian mobile number is required for delivery updates'
    };
  }
  return { digits, e164: `+91${digits}` };
}

// Does this authenticated session own this order?
//
// payment_details.user_id is checked first because it is the account identity for both providers.
// The phone-digit comparison is kept as a fallback so orders written before user_id was recorded
// still resolve for their phone-OTP owners. A Google session has no phone digits, so the fallback
// is skipped entirely for it — otherwise '' would match any order with an unparseable number.
function ownsOrder(order, auth) {
  const details = (order && typeof order.payment_details === 'object' && order.payment_details) || {};
  if (details.user_id && auth.userId) {
    return details.user_id === auth.userId;
  }
  if (!auth.phoneDigits) return false;
  const orderDigits = (order.phone_number || order.phone || '').replace(/\D/g, '').slice(-10);
  return !!orderDigits && orderDigits === auth.phoneDigits.slice(-10);
}

// Authoritative Price & Stock Calculation Helper
//
// Promo codes are resolved here and nowhere else. The cart drawer used to apply MATRIX10 in the
// browser and render a reduced total, while this function — the only thing that decides what the
// customer is actually charged — knew nothing about it. The customer saw "10% off applied" and paid
// full price. Any code the client sends is now re-validated server-side; an unknown code is a hard
// 400 rather than a silent full-price charge.
const PROMO_CODES = {
  MATRIX10: { percent: 10, minSubtotal: 0 }
};

function resolvePromo(rawCode) {
  if (!rawCode) return null;
  const code = String(rawCode).trim().toUpperCase();
  if (!code) return null;
  const promo = PROMO_CODES[code];
  if (!promo) {
    throw { status: 400, message: `Promo code "${code}" is not valid` };
  }
  return { code, ...promo };
}

// Maps a snake_case orders row to the camelCase shape every client renderer expects. Handing the
// raw row back made the confirmation receipt print "undefined (undefined)" for payment method and
// status and left the customer name blank, because the row has customer_name / payment_method /
// payment_status. NUMERIC columns arrive from PostgREST as strings, so they are coerced here too.
function toClientOrder(row) {
  if (!row) return null;
  const details = (row.payment_details && typeof row.payment_details === 'object') ? row.payment_details : {};
  let items = [];
  try {
    items = Array.isArray(row.items) ? row.items : JSON.parse(row.items || '[]');
  } catch {
    items = [];
  }
  return {
    id: row.id,
    date: row.created_at ? new Date(row.created_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN'),
    createdAt: row.created_at || null,
    customerName: row.customer_name,
    phone: row.phone || row.phone_number,
    phoneNumber: row.phone_number,
    email: row.email,
    address: row.address,
    items: items.map(i => ({
      id: i.id || i.productId || null,
      name: i.name,
      size: i.size || 'M',
      qty: Math.max(1, parseInt(i.qty, 10) || 1),
      price: Number(i.price) || 0,
      imagePrimary: i.imagePrimary || null
    })),
    subtotal: Number(row.subtotal) || 0,
    shipping: Number(row.shipping) || 0,
    tax: Number(row.tax) || 0,
    total: Number(row.total) || 0,
    discount: Number(details.promo?.amount) || 0,
    promo: details.promo || null,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentDetails: details,
    stockWarnings: Array.isArray(details.stock_warnings) ? details.stock_warnings : [],
    razorpayOrderId: row.razorpay_order_id || null,
    razorpayPaymentId: row.razorpay_payment_id || null
  };
}

async function calculateAuthoritativeOrder(items, promoCode) {
  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'Cart items are required' };
  }

  const productIds = items.map(i => i.id).filter(Boolean);
  if (productIds.length !== items.length) {
    throw { status: 400, message: 'Each line item must have a valid product id' };
  }

  // Authoritative catalog lookup from database
  const idFilter = `id=in.(${productIds.map(encodeURIComponent).join(',')})`;
  const dbProducts = await supabaseQuery(`products?${idFilter}&select=id,name,price,stock_qty,in_stock,sizes,size_stock,image_primary`);

  const productMap = new Map((dbProducts || []).map(p => [p.id, p]));

  let subtotal = 0;
  const verifiedItems = [];

  for (const clientItem of items) {
    const dbProduct = productMap.get(clientItem.id);
    if (!dbProduct) {
      throw { status: 400, message: `Product "${clientItem.id}" does not exist in catalog` };
    }
    if (!dbProduct.in_stock || (dbProduct.stock_qty <= 0)) {
      throw { status: 400, message: `Product "${dbProduct.name}" is currently out of stock` };
    }

    const size = (clientItem.size || 'M').trim();
    const sizeStock = dbProduct.size_stock || {};

    // The size the customer picked has to be one the product actually stocks. The old fallback —
    // `sizeStock[size] !== undefined ? sizeStock[size] : dbProduct.stock_qty` — measured an unknown
    // size against the product's whole stock and let the order through. Sizes differ per product
    // (tm-005 stocks no S, for example), and decrement_product_stock reads
    // COALESCE((size_stock ->> p_size)::int, 0), so an unstocked size is 0 there and the RPC
    // returns false. The result was a captured payment with no inventory movement. Reject it here,
    // before Razorpay is ever contacted.
    const offeredSizes = Array.isArray(dbProduct.sizes) ? dbProduct.sizes.map(s => String(s).trim()) : [];
    if (offeredSizes.length > 0 && !offeredSizes.includes(size)) {
      throw { status: 400, message: `"${dbProduct.name}" is not offered in size ${size}. Available: ${offeredSizes.join(', ')}` };
    }
    if (sizeStock[size] === undefined) {
      throw { status: 400, message: `Size ${size} is not available for "${dbProduct.name}"` };
    }
    const availableForSize = parseInt(sizeStock[size], 10) || 0;

    const qty = Math.max(1, Math.min(10, parseInt(clientItem.qty, 10) || 1));
    if (availableForSize < qty) {
      throw { status: 400, message: `Insufficient stock for "${dbProduct.name}" (Size ${size}). Available: ${availableForSize}` };
    }

    const unitPrice = Number(dbProduct.price);
    subtotal += (unitPrice * qty);

    verifiedItems.push({
      id: dbProduct.id,
      name: dbProduct.name,
      size: size,
      qty: qty,
      price: unitPrice,
      imagePrimary: dbProduct.image_primary
    });
  }

  const config = getPaymentConfig();
  const promo = resolvePromo(promoCode);

  let discount = 0;
  let appliedPromo = null;
  if (promo) {
    if (subtotal < promo.minSubtotal) {
      throw { status: 400, message: `Promo ${promo.code} requires a minimum subtotal of ₹${promo.minSubtotal}` };
    }
    discount = Math.round(subtotal * (promo.percent / 100));
    appliedPromo = { code: promo.code, percent: promo.percent, amount: discount };
  }

  // Free-shipping threshold is judged on the gross subtotal so a promo code can never push an
  // order back into paying shipping. Matches store.getCartTotal() in the browser.
  const shipping = (subtotal >= 2499 || subtotal === 0) ? 0 : 99;
  const tax = config.enableGST ? Math.round((subtotal - discount) * (config.gstRate || 0.12)) : 0;
  const total = subtotal - discount + shipping + tax;

  return {
    verifiedItems,
    subtotal,
    discount,
    appliedPromo,
    shipping,
    tax,
    total,
    amountInPaise: Math.round(total * 100)
  };
}

// State-Transition Gated Settlement Helper
async function settleRazorpayOrder(razorpayOrderId, razorpayPaymentId, paidAmountPaise) {
  const orders = await supabaseQuery(`orders?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&select=*`);
  if (!orders || orders.length === 0) {
    throw { status: 404, message: `Order not found for Razorpay Order ID: ${razorpayOrderId}` };
  }
  const order = orders[0];

  if (order.payment_status === 'PAID') {
    return { success: true, alreadySettled: true, order };
  }

  // Verify amount equality
  if (paidAmountPaise !== undefined && paidAmountPaise !== null) {
    const expectedPaise = Math.round(Number(order.total) * 100);
    if (paidAmountPaise !== expectedPaise) {
      throw { status: 400, message: `Amount mismatch: expected ₹${order.total} (${expectedPaise} paise) but received ${paidAmountPaise} paise` };
    }
  }

  // Perform conditional atomic state transition:
  // UPDATE orders SET payment_status='PAID', razorpay_payment_id=$2 WHERE razorpay_order_id=$1 AND payment_status='PENDING_PAYMENT'
  const updatedOrders = await supabaseQuery(`orders?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&payment_status=eq.PENDING_PAYMENT`, {
    method: 'PATCH',
    body: {
      payment_status: 'PAID',
      razorpay_payment_id: razorpayPaymentId
    }
  });

  if (!updatedOrders || updatedOrders.length === 0) {
    // Parallel handler (redirect/webhook) already transitioned the row
    return { success: true, alreadySettled: true, order };
  }

  const settledOrder = updatedOrders[0];

  // Atomically decrement stock strictly on successful state transition
  const items = Array.isArray(settledOrder.items) ? settledOrder.items : JSON.parse(settledOrder.items || '[]');
  // decrementStockRpc returns false both when the RPC call fails and when the SQL function itself
  // returns false (insufficient stock / unknown product / unknown size). Discarding that boolean
  // silently oversold: the payment is already captured at this point, so the only honest thing to
  // do is record the failure on the order so the merchant sees it before dispatch. Nothing here
  // may throw — the customer's money is taken and the row is already PAID.
  const stockWarnings = [];
  for (const item of items) {
    const productId = item.id || item.productId;
    const size = item.size || 'M';
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    if (!productId) {
      stockWarnings.push({ productId: null, size, qty, reason: 'line item has no product id' });
      continue;
    }
    const ok = await decrementStockRpc(productId, size, qty);
    if (!ok) {
      stockWarnings.push({ productId, size, qty, reason: 'stock decrement rejected — verify inventory before dispatch' });
    }
  }

  if (stockWarnings.length > 0) {
    console.error(`[OVERSELL RISK] Order ${settledOrder.id} is PAID but stock was not decremented:`, JSON.stringify(stockWarnings));
    try {
      const patched = await supabaseQuery(`orders?id=eq.${encodeURIComponent(settledOrder.id)}`, {
        method: 'PATCH',
        body: {
          payment_details: { ...(settledOrder.payment_details || {}), stock_warnings: stockWarnings }
        }
      });
      if (Array.isArray(patched) && patched.length > 0) settledOrder.payment_details = patched[0].payment_details;
    } catch (patchErr) {
      console.error(`Failed to persist stock warnings on order ${settledOrder.id}:`, patchErr);
    }
  }

  return { success: true, alreadySettled: false, order: settledOrder, stockWarnings };
}

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const ALLOWED_STATIC_DIRS = ['assets', 'js', 'styles'];

function serveFileDirectly(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Internal Server Error');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function handleStaticFile(req, res, reqUrl) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method Not Allowed');
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(reqUrl);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Bad Request');
  }

  const normalized = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  const cleanPath = normalized.replace(/^[\\\/]+/, '');
  const firstSegment = cleanPath.split(/[\\\/]/)[0];

  // Strictly forbid any dotfiles, hidden folders, or directory escapes
  if (cleanPath.startsWith('.') || firstSegment.startsWith('.') || cleanPath.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  if (cleanPath === '' || cleanPath === 'index.html') {
    const indexPath = path.join(__dirname, 'index.html');
    return serveFileDirectly(res, indexPath, 'text/html; charset=UTF-8');
  }

  const ext = path.extname(cleanPath).toLowerCase();

  if (!ALLOWED_STATIC_DIRS.includes(firstSegment)) {
    if (!ext && !cleanPath.includes('/')) {
      const indexPath = path.join(__dirname, 'index.html');
      return serveFileDirectly(res, indexPath, 'text/html; charset=UTF-8');
    }
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  const fullPath = path.resolve(__dirname, cleanPath);
  if (!fullPath.startsWith(path.resolve(__dirname) + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (!ext) {
        const indexPath = path.join(__dirname, 'index.html');
        return serveFileDirectly(res, indexPath, 'text/html; charset=UTF-8');
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }

    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    serveFileDirectly(res, fullPath, mime);
  });
}

// ===================================================
// HTTP Server & API Routing
// ===================================================
export async function handleRequest(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    const matchedOrigin = getCorsOrigin(req);
    const headers = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Razorpay-Signature'
    };
    if (matchedOrigin) {
      headers['Access-Control-Allow-Origin'] = matchedOrigin;
    }
    res.writeHead(204, headers);
    res.end();
    return;
  }

  const reqUrl = req.url.split('?')[0];

  // In cloud/serverless runtime, return clear descriptive error if credentials are not configured yet
  if (missingEnvVars.length > 0 && reqUrl.startsWith('/api/')) {
    return sendJSON(res, 500, {
      success: false,
      error: `Backend environment configuration incomplete. Missing variable(s): ${missingEnvVars.join(', ')}. Please configure them in your Vercel Project Settings -> Environment Variables.`
    }, req);
  }
  if (req.method === 'GET' && reqUrl === '/api/payment-config') {
    const config = getPaymentConfig();
    return sendJSON(res, 200, {
      merchantUpiVpa: config.merchantUpiVpa,
      merchantName: config.merchantName || 'Tee Matrix',
      razorpayKeyId: RAZORPAY_KEY_ID,
      isRazorpayConfigured: true,
      enableCOD: config.enableCOD !== false,
      enableGST: config.enableGST === true,
      gstRate: config.gstRate || 0.12,
      // Published so the cart can show the same discount the server will actually charge, instead
      // of keeping its own hardcoded copy that could drift from PROMO_CODES.
      promoCodes: Object.fromEntries(
        Object.entries(PROMO_CODES).map(([code, p]) => [code, { percent: p.percent, minSubtotal: p.minSubtotal }])
      )
    }, req);
  }

  // ---------------------------------------------------
  // Route 2: POST /api/create-razorpay-order (Customer Auth Required)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/create-razorpay-order') {
    try {
      const auth = await verifyCustomer(req);
      const { parsed: body } = await parseBodyWithRaw(req);
      const items = body.items || [];
      const shippingAddress = composeShippingAddress(body.shippingInfo);
      const deliveryPhone = resolveDeliveryPhone(body.shippingInfo, auth);

      // Calculate authoritative server total from DB prices and stock
      const calculation = await calculateAuthoritativeOrder(items, body.promoCode);

      // Allocate the order id up front so it can travel as the Razorpay receipt, which is what
      // makes a dashboard payment traceable back to a row without a lookup table.
      const tmOrderId = generateOrderId();

      const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          amount: calculation.amountInPaise,
          currency: 'INR',
          receipt: tmOrderId,
          notes: {
            customer_name: body.shippingInfo?.name || '',
            customer_phone: deliveryPhone.e164
          }
        })
      });

      const rzpData = await rzpResponse.json();
      if (!rzpResponse.ok || !rzpData.id) {
        return sendJSON(res, 502, {
          error: rzpData.error?.description || 'Failed to create order on Razorpay gateway'
        }, req);
      }

      // Persist order in Supabase with PENDING_PAYMENT status using service-role key
      const orderRow = {
        id: tmOrderId,
        phone_number: deliveryPhone.digits,
        customer_name: body.shippingInfo?.name || 'Customer',
        email: body.shippingInfo?.email || auth.email || '',
        phone: deliveryPhone.digits,
        address: shippingAddress,
        items: calculation.verifiedItems,
        subtotal: calculation.subtotal,
        shipping: calculation.shipping,
        tax: calculation.tax,
        total: calculation.total,
        status: 'Processing (Online Dispatch)',
        razorpay_order_id: rzpData.id,
        payment_status: 'PENDING_PAYMENT',
        payment_method: 'Razorpay',
        // user_id is the real account identity (either provider); phone_number is just delivery.
        payment_details: {
          user_id: auth.userId,
          auth_provider: auth.provider,
          ...(calculation.appliedPromo ? { promo: calculation.appliedPromo } : {})
        }
      };

      let finalOrderId = tmOrderId;
      try {
        await supabaseQuery('orders', { method: 'POST', body: [orderRow] });
      } catch (insertErr) {
        if (!isUniqueViolation(insertErr)) {
          // The gateway order already exists but no row was written. Log the id so the
          // orphan can be found and cancelled in the Razorpay dashboard.
          console.error(`[Orders] ORPHANED Razorpay order ${rzpData.id} — no DB row written`, insertErr);
          throw insertErr;
        }
        // Vanishingly rare. Take a fresh id and accept that the Razorpay receipt no longer
        // matches — a recorded order matters more than a tidy receipt.
        const retry = await insertOrderWithUniqueId(id => ({ ...orderRow, id }));
        finalOrderId = retry.id;
        console.warn(`[Orders] Receipt ${tmOrderId} does not match stored id ${finalOrderId} after collision`);
      }

      return sendJSON(res, 200, {
        success: true,
        order_id: rzpData.id,
        tm_order_id: finalOrderId,
        amount: calculation.total,
        amount_paise: calculation.amountInPaise,
        subtotal: calculation.subtotal,
        discount: calculation.discount,
        promo: calculation.appliedPromo,
        shipping: calculation.shipping,
        tax: calculation.tax,
        address: shippingAddress,
        currency: 'INR',
        key_id: RAZORPAY_KEY_ID
      }, req);
    } catch (err) {
      return sendOrderFailure(res, req, err, 'Create Razorpay order failed');
    }
  }

  // ---------------------------------------------------
  // Route 3: POST /api/create-order (UPI QR & COD Checkout)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/create-order') {
    try {
      const auth = await verifyCustomer(req);
      const { parsed: body } = await parseBodyWithRaw(req);
      const items = body.items || [];
      const paymentMethod = body.paymentMethod === 'COD' ? 'COD' : 'UPI';

      // COD is a merchant setting. The browser only hides the COD tab when enableCOD is false;
      // anything that posts paymentMethod:'COD' directly would otherwise create an unpaid
      // COD_PENDING order on a store that has COD switched off.
      if (paymentMethod === 'COD' && !getPaymentConfig().enableCOD) {
        return sendJSON(res, 400, { error: 'Cash on Delivery is not available for this store' }, req);
      }

      const shippingAddress = composeShippingAddress(body.shippingInfo);
      const deliveryPhone = resolveDeliveryPhone(body.shippingInfo, auth);
      const calculation = await calculateAuthoritativeOrder(items, body.promoCode);

      const initialPaymentStatus = paymentMethod === 'COD' ? 'COD_PENDING' : 'PENDING_VERIFICATION';

      const buildOrderRow = (id) => ({
        id,
        phone_number: deliveryPhone.digits,
        customer_name: body.shippingInfo?.name || 'Customer',
        email: body.shippingInfo?.email || auth.email || '',
        phone: deliveryPhone.digits,
        address: shippingAddress,
        items: calculation.verifiedItems,
        subtotal: calculation.subtotal,
        shipping: calculation.shipping,
        tax: calculation.tax,
        total: calculation.total,
        status: 'Processing (Online Dispatch)',
        payment_status: initialPaymentStatus,
        payment_method: paymentMethod,
        // Client-supplied paymentDetails is spread first, then the server-derived identity is
        // written last so a crafted body cannot spoof user_id/auth_provider.
        payment_details: {
          ...(body.paymentDetails || {}),
          ...(calculation.appliedPromo ? { promo: calculation.appliedPromo } : {}),
          user_id: auth.userId,
          auth_provider: auth.provider
        }
      });

      const { id: createdId, row: createdRow } = await insertOrderWithUniqueId(buildOrderRow);

      return sendJSON(res, 200, {
        success: true,
        order: toClientOrder(createdRow || buildOrderRow(createdId))
      }, req);
    } catch (err) {
      return sendOrderFailure(res, req, err, 'Create order failed');
    }
  }

  // ---------------------------------------------------
  // Route 4: POST /api/submit-upi-utr (Customer UTR Submission)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/submit-upi-utr') {
    try {
      const auth = await verifyCustomer(req);
      const { parsed: body } = await parseBodyWithRaw(req);
      const { order_id, utr } = body;

      if (!order_id || !utr || !utr.trim()) {
        return sendJSON(res, 400, { error: 'order_id and utr are required' }, req);
      }

      const orders = await supabaseQuery(`orders?id=eq.${encodeURIComponent(order_id)}&select=*`);
      if (!orders || orders.length === 0) {
        return sendJSON(res, 404, { error: 'Order not found' }, req);
      }

      const targetOrder = orders[0];
      if (!ownsOrder(targetOrder, auth)) {
        return sendJSON(res, 403, { error: 'Forbidden: Order does not belong to authenticated account' }, req);
      }

      const updatedDetails = {
        ...(typeof targetOrder.payment_details === 'object' ? targetOrder.payment_details : {}),
        submittedUtr: utr.trim(),
        utrSubmittedAt: new Date().toISOString()
      };

      const updated = await supabaseQuery(`orders?id=eq.${encodeURIComponent(order_id)}`, {
        method: 'PATCH',
        body: {
          payment_details: updatedDetails
        }
      });

      return sendJSON(res, 200, {
        success: true,
        message: 'UTR registered for administrator verification',
        order: updated ? updated[0] : targetOrder
      }, req);
    } catch (err) {
      console.error('Submit UTR error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Internal Server Error' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 5: POST /api/verify-razorpay-payment (Client Success Callback)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/verify-razorpay-payment') {
    try {
      const { parsed: body } = await parseBodyWithRaw(req);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return sendJSON(res, 400, { error: 'Missing required payment verification identifiers' }, req);
      }

      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const receivedBuf = Buffer.from(razorpay_signature, 'utf8');

      if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Invalid payment signature. Transaction tampering detected.'
        }, req);
      }

      // Fetch payment amount from Razorpay API to prevent replay of different amounts
      let paidAmountPaise = null;
      try {
        const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpay_payment_id)}`, {
          headers: { 'Authorization': authHeader }
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          paidAmountPaise = payData.amount;
        }
      } catch (_) {}

      const settlement = await settleRazorpayOrder(razorpay_order_id, razorpay_payment_id, paidAmountPaise);

      return sendJSON(res, 200, {
        success: true,
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'PAID',
        alreadySettled: settlement.alreadySettled
      }, req);
    } catch (err) {
      console.error('Verify payment error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Internal Server Error' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 6: POST /api/razorpay-webhook (Raw Byte HMAC Verification)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/razorpay-webhook') {
    try {
      const { parsed: body, rawBuffer } = await parseBodyWithRaw(req);
      const signature = req.headers['x-razorpay-signature'];

      if (!signature) {
        return sendJSON(res, 401, { error: 'Missing x-razorpay-signature header' }, req);
      }

      const expectedSig = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBuffer)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSig, 'utf8');
      const receivedBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
        console.warn('[Webhook] Signature mismatch');
        return sendJSON(res, 401, { error: 'Invalid webhook signature' }, req);
      }

      const event = body.event;
      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = body.payload?.payment?.entity;
        const rzpOrderId = paymentEntity?.order_id || body.payload?.order?.entity?.id;
        const rzpPaymentId = paymentEntity?.id;
        const paidAmountPaise = paymentEntity?.amount;

        if (rzpOrderId && rzpPaymentId) {
          await settleRazorpayOrder(rzpOrderId, rzpPaymentId, paidAmountPaise);
          console.log(`[Webhook] Succeeded settling Razorpay Order: ${rzpOrderId}`);
        }
      }

      return sendJSON(res, 200, { status: 'ok' }, req);
    } catch (err) {
      console.error('Webhook processing error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Webhook Error' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 7: GET /api/admin/verify-session (Admin Gate)
  // ---------------------------------------------------
  if (req.method === 'GET' && reqUrl === '/api/admin/verify-session') {
    try {
      const adminAuth = await requireAdmin(req);
      return sendJSON(res, 200, {
        success: true,
        role: adminAuth.role,
        email: adminAuth.email || null,
        phone: adminAuth.phone || null,
        adminIdentifier: adminAuth.adminIdentifier || adminAuth.email || adminAuth.phone
      }, req);
    } catch (err) {
      const status = err.status || 401;
      return sendJSON(res, status, { error: err.message || 'Unauthorized' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 8: POST /api/admin/payment-config (Admin Config Update)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/admin/payment-config') {
    try {
      await requireAdmin(req);
      const { parsed: body } = await parseBodyWithRaw(req);

      const current = getPaymentConfig();
      let updatedVpa = current.merchantUpiVpa;

      if (body.merchantUpiVpa !== undefined) {
        const vpaCandidate = body.merchantUpiVpa.trim();
        const vpaRegex = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;
        if (!vpaRegex.test(vpaCandidate)) {
          return sendJSON(res, 400, { error: 'Invalid UPI VPA format. Must match user@bank format.' }, req);
        }
        updatedVpa = vpaCandidate;
      }

      const updated = {
        ...current,
        merchantUpiVpa: updatedVpa,
        merchantName: body.merchantName !== undefined ? body.merchantName.trim() : current.merchantName,
        enableCOD: body.enableCOD !== undefined ? !!body.enableCOD : current.enableCOD,
        enableGST: body.enableGST !== undefined ? !!body.enableGST : current.enableGST,
        gstRate: body.gstRate !== undefined ? Number(body.gstRate) : current.gstRate
      };

      savePaymentConfig(updated);
      return sendJSON(res, 200, { success: true, config: updated }, req);
    } catch (err) {
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Failed to update config' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 9: POST /api/admin/confirm-upi-payment (Admin Confirms UPI / COD Delivery)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/admin/confirm-upi-payment') {
    try {
      const adminAuth = await requireAdmin(req);
      const { parsed: body } = await parseBodyWithRaw(req);
      const { order_id } = body;

      if (!order_id) {
        return sendJSON(res, 400, { error: 'order_id is required' }, req);
      }

      const orders = await supabaseQuery(`orders?id=eq.${encodeURIComponent(order_id)}&select=*`);
      if (!orders || orders.length === 0) {
        return sendJSON(res, 404, { error: 'Order not found' }, req);
      }

      const targetOrder = orders[0];
      if (targetOrder.payment_status === 'PAID') {
        return sendJSON(res, 200, { success: true, message: 'Order is already marked PAID', order: targetOrder }, req);
      }

      // Conditional state transition on PENDING_VERIFICATION or COD_PENDING
      const updatedOrders = await supabaseQuery(`orders?id=eq.${encodeURIComponent(order_id)}&payment_status=in.(PENDING_VERIFICATION,COD_PENDING)`, {
        method: 'PATCH',
        body: {
          payment_status: 'PAID',
          payment_details: {
            ...(typeof targetOrder.payment_details === 'object' ? targetOrder.payment_details : {}),
            confirmedByAdminPhone: adminAuth.phone,
            confirmedAt: new Date().toISOString()
          }
        }
      });

      if (!updatedOrders || updatedOrders.length === 0) {
        return sendJSON(res, 400, { error: 'Order could not be transitioned to PAID' }, req);
      }

      const confirmedOrder = updatedOrders[0];

      // Decrement stock atomically. As in settleRazorpayOrder, a false return means the decrement
      // did NOT happen — the admin must be told, not shown an unconditional "Stock decremented."
      const items = Array.isArray(confirmedOrder.items) ? confirmedOrder.items : JSON.parse(confirmedOrder.items || '[]');
      const stockWarnings = [];
      for (const item of items) {
        const productId = item.id || item.productId;
        const size = item.size || 'M';
        const qty = Math.max(1, parseInt(item.qty, 10) || 1);
        if (!productId) {
          stockWarnings.push({ productId: null, size, qty, reason: 'line item has no product id' });
          continue;
        }
        const ok = await decrementStockRpc(productId, size, qty);
        if (!ok) {
          stockWarnings.push({ productId, size, qty, reason: 'stock decrement rejected — verify inventory before dispatch' });
        }
      }

      if (stockWarnings.length > 0) {
        console.error(`[OVERSELL RISK] Order ${confirmedOrder.id} confirmed PAID but stock was not decremented:`, JSON.stringify(stockWarnings));
        try {
          const patched = await supabaseQuery(`orders?id=eq.${encodeURIComponent(order_id)}`, {
            method: 'PATCH',
            body: {
              payment_details: { ...(confirmedOrder.payment_details || {}), stock_warnings: stockWarnings }
            }
          });
          if (Array.isArray(patched) && patched.length > 0) confirmedOrder.payment_details = patched[0].payment_details;
        } catch (patchErr) {
          console.error(`Failed to persist stock warnings on order ${confirmedOrder.id}:`, patchErr);
        }
      }

      return sendJSON(res, 200, {
        success: true,
        message: stockWarnings.length === 0
          ? 'Payment verified and order marked PAID. Stock decremented.'
          : `Payment verified and order marked PAID, but stock was NOT decremented for ${stockWarnings.length} item(s). Check inventory before dispatch.`,
        stockWarnings,
        order: confirmedOrder
      }, req);
    } catch (err) {
      console.error('Confirm UPI payment error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Internal Server Error' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 10: POST /api/admin/reject-payment (Admin Rejects Fake UTR)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/admin/reject-payment') {
    try {
      const adminAuth = await requireAdmin(req);
      const { parsed: body } = await parseBodyWithRaw(req);
      const { order_id, reason } = body;

      if (!order_id) {
        return sendJSON(res, 400, { error: 'order_id is required' }, req);
      }

      const orders = await supabaseQuery(`orders?id=eq.${encodeURIComponent(order_id)}&select=*`);
      if (!orders || orders.length === 0) {
        return sendJSON(res, 404, { error: 'Order not found' }, req);
      }

      const targetOrder = orders[0];
      const updatedOrders = await supabaseQuery(`orders?id=eq.${encodeURIComponent(order_id)}&payment_status=in.(PENDING_VERIFICATION,COD_PENDING,PENDING_PAYMENT)`, {
        method: 'PATCH',
        body: {
          payment_status: 'FAILED',
          status: 'Payment Failed / Rejected',
          payment_details: {
            ...(typeof targetOrder.payment_details === 'object' ? targetOrder.payment_details : {}),
            rejectedByAdminPhone: adminAuth.phone,
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason || 'Invalid or unverified transaction'
          }
        }
      });

      // A zero-row PATCH means the guard `payment_status=in.(...)` didn't match — the order is
      // already PAID or already FAILED. Reporting success here told the admin they had rejected a
      // UTR when nothing changed, so a settled order stayed settled while the dashboard implied
      // otherwise. Report the real outcome instead.
      if (!updatedOrders || updatedOrders.length === 0) {
        return sendJSON(res, 409, {
          error: `Order cannot be rejected from its current state (${targetOrder.payment_status}). Only PENDING_VERIFICATION, COD_PENDING or PENDING_PAYMENT orders can be rejected.`,
          order: targetOrder
        }, req);
      }

      return sendJSON(res, 200, {
        success: true,
        message: 'Order marked as FAILED',
        order: updatedOrders[0]
      }, req);
    } catch (err) {
      console.error('Reject payment error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Internal Server Error' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 11: GET /api/admin/orders (Admin Order List)
  // ---------------------------------------------------
  // The admin dashboard used to read orders from its own browser localStorage, so the owner only
  // ever saw orders that happened to be placed in that same browser profile. Orders from real
  // customers were invisible — including every UPI order awaiting UTR verification, which meant
  // the Confirm Paid / Reject UTR buttons never rendered and no UPI order could ever be settled.
  // This route is the authoritative read. Rows are mapped to the camelCase shape the dashboard
  // renderer already expects by toClientOrder(), which also coerces NUMERIC columns to numbers
  // (PostgREST returns them as strings, so `sum + o.total` would otherwise concatenate).
  if (req.method === 'GET' && reqUrl === '/api/admin/orders') {
    try {
      await requireAdmin(req);
      const rows = await supabaseQuery('orders?select=*&order=created_at.desc&limit=500');
      const orders = (rows || []).map(toClientOrder);
      return sendJSON(res, 200, { success: true, orders }, req);
    } catch (err) {
      console.error('Admin orders fetch error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Internal Server Error' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 12: POST /api/admin/save-product (Admin Product Upsert via Service Role)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/admin/save-product') {
    try {
      await requireAdmin(req);
      const { parsed: body } = await parseBodyWithRaw(req);
      const product = body.product;
      if (!product || !product.id || !product.name) {
        return sendJSON(res, 400, { error: 'Product payload requires an id and name' }, req);
      }

      const row = {
        id: product.id,
        name: product.name,
        category: product.category || 'Graphic',
        price: Number(product.price) || 0,
        fit: product.fit || 'Boxy Oversized Fit',
        fabric: product.fabric || '100% Cotton',
        description: product.description || '',
        highlights: Array.isArray(product.highlights) ? product.highlights : [],
        sizes: Array.isArray(product.sizes) ? product.sizes : ['S', 'M', 'L', 'XL'],
        size_stock: typeof product.sizeStock === 'object' && product.sizeStock !== null ? product.sizeStock : {},
        colors: Array.isArray(product.colors) ? product.colors : ['Black'],
        image_primary: product.imagePrimary || (Array.isArray(product.images) && product.images[0]) || '',
        image_hover: product.imageHover || (Array.isArray(product.images) && product.images[1]) || '',
        images: Array.isArray(product.images) ? product.images : [],
        in_stock: product.inStock !== undefined ? !!product.inStock : true,
        stock_qty: Number(product.stockQty) || 0,
        badge: product.badge || 'NEW',
        is_featured: !!product.isFeatured,
        is_new_arrival: product.isNewArrival !== undefined ? !!product.isNewArrival : true,
        model_image_type: product.modelImageType || 'product_only'
      };

      const upserted = await supabaseQuery('products', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: [row]
      });

      return sendJSON(res, 200, { success: true, product: upserted ? upserted[0] : row }, req);
    } catch (err) {
      console.error('Save product error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Failed to save product in database' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 13: POST /api/admin/delete-product (Admin Product Delete via Service Role)
  // ---------------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/admin/delete-product') {
    try {
      await requireAdmin(req);
      const { parsed: body } = await parseBodyWithRaw(req);
      const { id } = body;
      if (!id) {
        return sendJSON(res, 400, { error: 'Product id is required' }, req);
      }

      await supabaseQuery(`products?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      return sendJSON(res, 200, { success: true, message: 'Product deleted from database' }, req);
    } catch (err) {
      console.error('Delete product error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Failed to delete product from database' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 12: Static File Serving & Hardened SPA Routing
  // ---------------------------------------------------
  handleStaticFile(req, res, reqUrl);
}

export const server = http.createServer(handleRequest);

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(` TEE MATRIX Secure Server is live at: http://localhost:${PORT}`);
    console.log(` Admin Portal accessible at: http://localhost:${PORT}/#admin`);
    console.log(`==================================================\n`);
  });
}

export default handleRequest;
