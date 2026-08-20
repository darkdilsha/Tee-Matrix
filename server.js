// TEE MATRIX - Production-Ready HTTP Dev & Payment API Server
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;

// Ensure local data directory exists for config persistence
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CONFIG_FILE = path.join(DATA_DIR, 'payment_config.json');

// Default initial payment configuration
const DEFAULT_PAYMENT_CONFIG = {
  merchantUpiVpa: 'teematrix@okaxis',
  merchantName: 'TEE MATRIX ATELIER',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
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

// Helper to read JSON request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ rawBody: body });
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Razorpay-Signature'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Razorpay-Signature'
    });
    res.end();
    return;
  }

  const reqUrl = req.url.split('?')[0];

  // ==========================================
  // API ROUTE 1: Get Public Payment Config
  // ==========================================
  if (req.method === 'GET' && reqUrl === '/api/payment-config') {
    const config = getPaymentConfig();
    return sendJSON(res, 200, {
      merchantUpiVpa: config.merchantUpiVpa || 'teematrix@okaxis',
      merchantName: config.merchantName || 'TEE MATRIX ATELIER',
      razorpayKeyId: config.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '',
      isRazorpayConfigured: !!(config.razorpayKeyId || process.env.RAZORPAY_KEY_ID),
      enableCOD: config.enableCOD !== false,
      enableGST: config.enableGST === true,
      gstRate: config.gstRate || 0.12
    });
  }

  // ==========================================
  // API ROUTE 2: Create Razorpay Order (Server-Side Calculation)
  // ==========================================
  if (req.method === 'POST' && reqUrl === '/api/create-razorpay-order') {
    try {
      const body = await parseBody(req);
      const items = body.items || [];
      const config = getPaymentConfig();
      const keyId = config.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!items || items.length === 0) {
        return sendJSON(res, 400, { error: 'Cart items are required' });
      }

      // Calculate server-side total from verified product prices
      let serverCalculatedTotal = 0;
      items.forEach(item => {
        const unitPrice = Number(item.price) || 0;
        const qty = Math.max(1, parseInt(item.qty) || 1);
        serverCalculatedTotal += (unitPrice * qty);
      });

      // Add tax if GST is explicitly enabled
      if (config.enableGST) {
        const gstAmount = Math.round(serverCalculatedTotal * (config.gstRate || 0.12));
        serverCalculatedTotal += gstAmount;
      }

      if (serverCalculatedTotal <= 0) {
        return sendJSON(res, 400, { error: 'Invalid order total' });
      }

      const amountInPaise = Math.round(serverCalculatedTotal * 100);

      // If Razorpay API credentials exist, invoke Razorpay Orders API
      if (keyId && keySecret) {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-6)}`,
            notes: {
              customer_name: body.shippingInfo?.name || '',
              customer_phone: body.shippingInfo?.phone || ''
            }
          })
        });

        const rzpData = await rzpResponse.json();
        if (rzpData.id) {
          return sendJSON(res, 200, {
            success: true,
            order_id: rzpData.id,
            amount: serverCalculatedTotal,
            amount_paise: amountInPaise,
            currency: 'INR',
            key_id: keyId
          });
        } else {
          return sendJSON(res, 502, {
            error: rzpData.error?.description || 'Failed to create order on Razorpay'
          });
        }
      } else {
        // Mock order creation for testing without live API keys
        const mockOrderId = `order_mock_${Date.now().toString().slice(-8)}`;
        return sendJSON(res, 200, {
          success: true,
          order_id: mockOrderId,
          amount: serverCalculatedTotal,
          amount_paise: amountInPaise,
          currency: 'INR',
          key_id: keyId || 'rzp_test_placeholder',
          isDemo: true
        });
      }
    } catch (err) {
      console.error('Create Razorpay order error:', err);
      return sendJSON(res, 500, { error: 'Internal Server Error' });
    }
  }

  // ==========================================
  // API ROUTE 3: Server-Side Razorpay Signature Verification
  // ==========================================
  if (req.method === 'POST' && reqUrl === '/api/verify-razorpay-payment') {
    try {
      const body = await parseBody(req);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!razorpay_order_id || !razorpay_payment_id) {
        return sendJSON(res, 400, { error: 'Missing payment identifiers' });
      }

      // If keySecret exists, perform cryptographic HMAC-SHA256 signature check
      if (keySecret) {
        if (!razorpay_signature) {
          return sendJSON(res, 400, { error: 'Missing payment signature' });
        }

        const generatedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (generatedSignature !== razorpay_signature) {
          return sendJSON(res, 400, {
            success: false,
            error: 'Invalid payment signature. Transaction tampering detected.'
          });
        }
      }

      return sendJSON(res, 200, {
        success: true,
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'PAID'
      });
    } catch (err) {
      console.error('Verify payment error:', err);
      return sendJSON(res, 500, { error: 'Internal Server Error' });
    }
  }

  // ==========================================
  // API ROUTE 4: Razorpay Webhook (Dropped Tabs / Async Settlements)
  // ==========================================
  if (req.method === 'POST' && reqUrl === '/api/razorpay-webhook') {
    try {
      const body = await parseBody(req);
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers['x-razorpay-signature'];

      if (webhookSecret && signature) {
        const rawContent = typeof body.rawBody === 'string' ? body.rawBody : JSON.stringify(body);
        const expectedSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawContent)
          .digest('hex');

        if (expectedSig !== signature) {
          console.warn('Webhook signature mismatch');
          return sendJSON(res, 400, { error: 'Invalid signature' });
        }
      }

      const event = body.event;
      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = body.payload?.payment?.entity;
        console.log(`[Webhook] Payment settled via webhook: ${paymentEntity?.id} for Order: ${paymentEntity?.order_id}`);
      }

      return sendJSON(res, 200, { status: 'ok' });
    } catch (err) {
      console.error('Webhook processing error:', err);
      return sendJSON(res, 500, { error: 'Webhook Error' });
    }
  }

  // ==========================================
  // API ROUTE 5: Admin Update Payment Configuration
  // ==========================================
  if (req.method === 'POST' && reqUrl === '/api/admin/payment-config') {
    try {
      const body = await parseBody(req);
      const current = getPaymentConfig();
      const updated = {
        ...current,
        merchantUpiVpa: body.merchantUpiVpa !== undefined ? body.merchantUpiVpa.trim() : current.merchantUpiVpa,
        merchantName: body.merchantName !== undefined ? body.merchantName.trim() : current.merchantName,
        razorpayKeyId: body.razorpayKeyId !== undefined ? body.razorpayKeyId.trim() : current.razorpayKeyId,
        enableCOD: body.enableCOD !== undefined ? !!body.enableCOD : current.enableCOD,
        enableGST: body.enableGST !== undefined ? !!body.enableGST : current.enableGST,
        gstRate: body.gstRate !== undefined ? Number(body.gstRate) : current.gstRate
      };

      savePaymentConfig(updated);
      return sendJSON(res, 200, { success: true, config: updated });
    } catch (err) {
      return sendJSON(res, 500, { error: 'Failed to update config' });
    }
  }

  // ==========================================
  // Static File Serving & SPA Routing
  // ==========================================
  let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'index.html'), (error, htmlContent) => {
          if (error) {
            res.writeHead(500);
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(htmlContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` TEE MATRIX Storefront is live at: http://localhost:${PORT}`);
  console.log(` Payment API available at: http://localhost:${PORT}/api/payment-config`);
  console.log(` Admin Portal accessible at: http://localhost:${PORT}/#admin`);
  console.log(`==================================================\n`);
});

