// TEE MATRIX - Supabase Integration Client Module
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://gqjpwnxnloltfzpqqipi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9pvBeEruDCaGN7tYTY1-JA_Y13NJ-o_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authorised Admin Numbers Whitelist (UI Hint Only)
export const AUTHORIZED_ADMIN_NUMBERS = [
  '+918593071292',
  '+91 8593071292',
  '8593071292'
];

// addresses.id and payment_methods.id are UUID columns. Client code used to mint ids like
// `addr-${Date.now()}`, which Postgres rejects with 22P02 (invalid input syntax for type uuid),
// so every save 400'd — silently, because the callers swallowed the error. Mint a real UUID so the
// row the browser holds and the row in the database share an id.
export function newUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts where crypto.randomUUID is unavailable.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
  });
}

export class SupabaseService {
  // Format phone number to E.164 standard (+91XXXXXXXXXX)
  formatPhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+91' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  }

  // Get current active session access token for Bearer headers
  async getAccessToken() {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    } catch (_) {
      return null;
    }
  }

  // 1. Send SMS OTP (Phone Auth - Real Supabase Gateway)
  async sendSMSOTP(rawPhone) {
    const phone = this.formatPhone(rawPhone);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone
      });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: `OTP sent successfully to ${phone}` };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send OTP' };
    }
  }

  // 2. Verify 6-Digit OTP Token
  async verifySMSOTP(rawPhone, token) {
    const phone = this.formatPhone(rawPhone);
    const cleanToken = token.trim();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: cleanToken,
        type: 'sms'
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data?.session) {
        return { success: true, user: data.user, session: data.session, phone };
      }
      return { success: false, message: 'Could not establish authenticated session' };
    } catch (e) {
      return { success: false, message: e.message || 'OTP verification failed' };
    }
  }

  // 3. Verify Admin Access via Server-Side Session Verification
  async verifyAdminNumber(rawPhone) {
    const phone = this.formatPhone(rawPhone);
    const token = await this.getAccessToken();
    if (!token) {
      return { success: false, message: 'Authentication required. Please sign in via OTP.' };
    }

    try {
      const res = await fetch('/api/admin/verify-session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, role: data.role || 'Super Admin', phone: data.phone || phone };
      }
      return { success: false, message: data.error || 'Access denied: caller is not an authorized administrator.' };
    } catch (err) {
      return { success: false, message: 'Could not verify admin credentials with server' };
    }
  }

  // 4. Products Table Operations
  async fetchProducts() {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: Number(p.price),
          fit: p.fit,
          fabric: p.fabric,
          description: p.description,
          highlights: typeof p.highlights === 'string' ? JSON.parse(p.highlights) : (Array.isArray(p.highlights) ? p.highlights : []),
          sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
          colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors,
          imagePrimary: p.image_primary,
          imageHover: p.image_hover,
          images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
          inStock: p.in_stock,
          stockQty: p.stock_qty,
          sizeStock: typeof p.size_stock === 'string' ? JSON.parse(p.size_stock) : (p.size_stock || null),
          badge: p.badge,
          isFeatured: p.is_featured,
          isNewArrival: p.is_new_arrival,
          modelImageType: p.model_image_type || 'product_only'
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch error, using local fallback:', err);
    }
    return null;
  }

  async saveProduct(product) {
    try {
      const row = {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        fit: product.fit,
        fabric: product.fabric,
        description: product.description,
        highlights: product.highlights || [],
        sizes: product.sizes,
        size_stock: product.sizeStock || {},
        colors: product.colors,
        image_primary: product.imagePrimary,
        image_hover: product.imageHover,
        images: product.images,
        in_stock: product.inStock,
        stock_qty: product.stockQty,
        badge: product.badge,
        is_featured: product.isFeatured,
        is_new_arrival: product.isNewArrival,
        model_image_type: product.modelImageType || 'product_only'
      };

      const { data, error } = await supabase.from('products').upsert([row]);
      if (error) console.warn('Supabase upsert product error:', error.message);
    } catch (e) {
      console.warn('Supabase save product error:', e);
    }
  }

  async deleteProduct(id) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.warn('Supabase delete product error:', error.message);
    } catch (e) {
      console.warn('Supabase delete product error:', e);
    }
  }

  // 4b. Product Image Upload to Supabase Storage
  async uploadProductImage(file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return { success: true, url: publicData.publicUrl, path: filePath };
    } catch (err) {
      console.error('Supabase Storage upload error:', err);
      return { success: false, error: err.message };
    }
  }

  async deleteProductImage(pathOrUrl) {
    try {
      let filePath = pathOrUrl;
      if (pathOrUrl.includes('/storage/v1/object/public/product-images/')) {
        filePath = pathOrUrl.split('/storage/v1/object/public/product-images/')[1];
      }
      const { data, error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Supabase Storage delete error:', err);
      return { success: false, error: err.message };
    }
  }

  // 5. Addresses CRUD Operations
  async fetchUserAddresses(phone) {
    try {
      const { data, error } = await supabase.from('addresses').select('*').eq('phone_number', phone).order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(a => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          addressLine: a.address_line,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          isDefault: a.is_default
        }));
      }
    } catch (e) {}
    return null;
  }

  async saveUserAddress(phone, addressData) {
    try {
      const row = {
        id: addressData.id || newUuid(),
        phone_number: phone,
        name: addressData.name,
        phone: addressData.phone,
        address_line: addressData.addressLine,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        is_default: addressData.isDefault || false
      };
      const { error } = await supabase.from('addresses').upsert([row]);
      if (error) {
        console.error('Failed to save address:', error);
        return { success: false, message: error.message };
      }
      return { success: true, id: row.id };
    } catch (e) {
      console.error('Failed to save address:', e);
      return { success: false, message: e.message || 'Network error while saving address' };
    }
  }

  // 6. Payment Methods CRUD (Masked references only)
  async fetchUserPaymentMethods(phone) {
    try {
      const { data, error } = await supabase.from('payment_methods').select('*').eq('phone_number', phone).order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(pm => ({
          id: pm.id,
          type: pm.type,
          maskedIdentifier: pm.masked_identifier,
          isDefault: pm.is_default
        }));
      }
    } catch (e) {}
    return null;
  }

  async saveUserPaymentMethod(phone, pmData) {
    try {
      const row = {
        id: pmData.id || newUuid(),
        phone_number: phone,
        type: pmData.type,
        masked_identifier: pmData.maskedIdentifier,
        is_default: pmData.isDefault || false
      };
      const { error } = await supabase.from('payment_methods').upsert([row]);
      if (error) {
        console.error('Failed to save payment method:', error);
        return { success: false, message: error.message };
      }
      return { success: true, id: row.id };
    } catch (e) {
      console.error('Failed to save payment method:', e);
      return { success: false, message: e.message || 'Network error while saving payment method' };
    }
  }

  // 7. Orders Read Operations (Client-Side Read Only)
  async fetchOrders() {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(o => ({
          id: o.id,
          date: o.date || new Date(o.created_at).toLocaleDateString(),
          customerName: o.customer_name,
          email: o.email,
          phone: o.phone || o.phone_number,
          phoneNumber: o.phone_number,
          address: o.address,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
          subtotal: Number(o.subtotal || 0),
          shipping: Number(o.shipping || 0),
          tax: Number(o.tax || 0),
          total: Number(o.total),
          paymentMethod: o.payment_method || 'UPI',
          paymentStatus: o.payment_status || 'PENDING_VERIFICATION',
          paymentDetails: typeof o.payment_details === 'string' ? JSON.parse(o.payment_details) : (o.payment_details || {}),
          status: o.status || 'CONFIRMED'
        }));
      }
    } catch (e) {}
    return null;
  }
}

export const supabaseService = new SupabaseService();
