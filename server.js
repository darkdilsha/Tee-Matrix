// TEE MATRIX - Production-Ready HTTP Dev & Payment API Server
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.error('\n[FATAL ERROR] Server boot refused. The following required environment variables are missing:');
  missingEnvVars.forEach(v => console.error(`  - ${v}`));
  console.error('Please configure all required environment variables before starting Tee Matrix server.\n');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Ensure local data directory exists for config persistence
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CONFIG_FILE = path.join(DATA_DIR, 'payment_config.json');

// Default initial payment configuration
const DEFAULT_PAYMENT_CONFIG = {
  merchantUpiVpa: 'teematrix@okaxis',
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
  const rawPhone = user.phone || user.user_metadata?.phone || '';
  const phoneDigits = rawPhone.replace(/\D/g, '');
  if (!phoneDigits) {
    throw { status: 401, message: 'No verified phone number found on authenticated session' };
  }

  return { user, phone: rawPhone, phoneDigits, token };
}

// Admin Auth Verification
async function requireAdmin(req) {
  const auth = await verifyCustomer(req);
  const admins = await supabaseQuery('admin_numbers?select=*');
  const isAdmin = Array.isArray(admins) && admins.some(a => (a.phone || '').replace(/\D/g, '') === auth.phoneDigits);
  if (!isAdmin) {
    throw { status: 403, message: 'Caller is not an authorized administrator' };
  }
  return { ...auth, role: 'Super Admin' };
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

// Authoritative Price & Stock Calculation Helper
async function calculateAuthoritativeOrder(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'Cart items are required' };
  }

  const productIds = items.map(i => i.id).filter(Boolean);
  if (productIds.length !== items.length) {
    throw { status: 400, message: 'Each line item must have a valid product id' };
  }

  // Authoritative catalog lookup from database
  const idFilter = `id=in.(${productIds.map(encodeURIComponent).join(',')})`;
  const dbProducts = await supabaseQuery(`products?${idFilter}&select=id,name,price,stock_qty,in_stock,size_stock,image_primary`);

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
    const availableForSize = sizeStock[size] !== undefined ? parseInt(sizeStock[size], 10) : dbProduct.stock_qty;

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
  const shipping = (subtotal >= 2499 || subtotal === 0) ? 0 : 99;
  const tax = config.enableGST ? Math.round(subtotal * (config.gstRate || 0.12)) : 0;
  const total = subtotal + shipping + tax;

  return {
    verifiedItems,
    subtotal,
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
  for (const item of items) {
    const productId = item.id || item.productId;
    const size = item.size || 'M';
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    if (productId) {
      await decrementStockRpc(productId, size, qty);
    }
  }

  return { success: true, alreadySettled: false, order: settledOrder };
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
const server = http.createServer(async (req, res) => {
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

  // ---------------------------------------------------
  // Route 1: GET /api/payment-config (Public Config)
  // ---------------------------------------------------
  if (req.method === 'GET' && reqUrl === '/api/payment-config') {
    const config = getPaymentConfig();
    return sendJSON(res, 200, {
      merchantUpiVpa: config.merchantUpiVpa,
      merchantName: config.merchantName || 'Tee Matrix',
      razorpayKeyId: RAZORPAY_KEY_ID,
      isRazorpayConfigured: true,
      enableCOD: config.enableCOD !== false,
      enableGST: config.enableGST === true,
      gstRate: config.gstRate || 0.12
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

      // Calculate authoritative server total from DB prices and stock
      const calculation = await calculateAuthoritativeOrder(items);

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
          receipt: `rcpt_${Date.now().toString().slice(-6)}`,
          notes: {
            customer_name: body.shippingInfo?.name || '',
            customer_phone: auth.phone
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
      const tmOrderId = `TM-${Date.now().toString().slice(-4)}`;
      const orderRow = {
        id: tmOrderId,
        phone_number: auth.phone,
        customer_name: body.shippingInfo?.name || 'Customer',
        email: body.shippingInfo?.email || '',
        phone: auth.phone,
        address: body.shippingInfo?.address || 'Direct Delivery',
        items: calculation.verifiedItems,
        subtotal: calculation.subtotal,
        shipping: calculation.shipping,
        tax: calculation.tax,
        total: calculation.total,
        status: 'Processing (Online Dispatch)',
        razorpay_order_id: rzpData.id,
        payment_status: 'PENDING_PAYMENT',
        payment_method: 'Razorpay',
        payment_details: {}
      };

      await supabaseQuery('orders', {
        method: 'POST',
        body: [orderRow]
      });

      return sendJSON(res, 200, {
        success: true,
        order_id: rzpData.id,
        tm_order_id: tmOrderId,
        amount: calculation.total,
        amount_paise: calculation.amountInPaise,
        currency: 'INR',
        key_id: RAZORPAY_KEY_ID
      }, req);
    } catch (err) {
      console.error('Create Razorpay order error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Internal Server Error' }, req);
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

      const calculation = await calculateAuthoritativeOrder(items);

      const tmOrderId = `TM-${Date.now().toString().slice(-4)}`;
      const initialPaymentStatus = paymentMethod === 'COD' ? 'COD_PENDING' : 'PENDING_VERIFICATION';

      const orderRow = {
        id: tmOrderId,
        phone_number: auth.phone,
        customer_name: body.shippingInfo?.name || 'Customer',
        email: body.shippingInfo?.email || '',
        phone: auth.phone,
        address: body.shippingInfo?.address || 'Direct Delivery',
        items: calculation.verifiedItems,
        subtotal: calculation.subtotal,
        shipping: calculation.shipping,
        tax: calculation.tax,
        total: calculation.total,
        status: 'Processing (Online Dispatch)',
        payment_status: initialPaymentStatus,
        payment_method: paymentMethod,
        payment_details: body.paymentDetails || {}
      };

      const createdOrders = await supabaseQuery('orders', {
        method: 'POST',
        body: [orderRow]
      });

      return sendJSON(res, 200, {
        success: true,
        order: createdOrders ? createdOrders[0] : orderRow
      }, req);
    } catch (err) {
      console.error('Create order error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Internal Server Error' }, req);
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
      const targetDigits = (targetOrder.phone_number || targetOrder.phone || '').replace(/\D/g, '');
      if (targetDigits !== auth.phoneDigits) {
        return sendJSON(res, 403, { error: 'Forbidden: Order does not belong to authenticated phone number' }, req);
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
        phone: adminAuth.phone
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

      // Decrement stock atomically
      const items = Array.isArray(confirmedOrder.items) ? confirmedOrder.items : JSON.parse(confirmedOrder.items || '[]');
      for (const item of items) {
        const productId = item.id || item.productId;
        const size = item.size || 'M';
        const qty = Math.max(1, parseInt(item.qty, 10) || 1);
        if (productId) {
          await decrementStockRpc(productId, size, qty);
        }
      }

      return sendJSON(res, 200, {
        success: true,
        message: 'Payment verified and order marked PAID. Stock decremented.',
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

      return sendJSON(res, 200, {
        success: true,
        message: 'Order marked as FAILED',
        order: updatedOrders ? updatedOrders[0] : targetOrder
      }, req);
    } catch (err) {
      console.error('Reject payment error:', err);
      const status = err.status || 500;
      return sendJSON(res, status, { error: err.message || 'Internal Server Error' }, req);
    }
  }

  // ---------------------------------------------------
  // Route 11: Static File Serving & Hardened SPA Routing
  // ---------------------------------------------------
  handleStaticFile(req, res, reqUrl);
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` TEE MATRIX Secure Server is live at: http://localhost:${PORT}`);
  console.log(` Admin Portal accessible at: http://localhost:${PORT}/#admin`);
  console.log(`==================================================\n`);
});
