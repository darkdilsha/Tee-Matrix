// TEE MATRIX - Supabase Integration Client Module
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://gqjpwnxnloltfzpqqipi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9pvBeEruDCaGN7tYTY1-JA_Y13NJ-o_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authorised Admin Numbers Whitelist (fallback cache & live table check)
export const AUTHORIZED_ADMIN_NUMBERS = [
  '+918593071292',
  '+91 8593071292',
  '8593071292'
];

export class SupabaseService {
  constructor() {
    this.activeOTPStore = new Map(); // Dev fallback OTP store
  }

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

  // 1. Send SMS OTP (Phone Auth)
  async sendSMSOTP(rawPhone) {
    const phone = this.formatPhone(rawPhone);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone
      });
      if (error) {
        console.warn('Supabase Auth warning:', error.message);
        // Dev / Demo OTP mode if SMS gateway is not yet linked in Supabase dashboard
        const devOTP = '123456';
        this.activeOTPStore.set(phone, devOTP);
        return { 
          success: true, 
          isDevMode: true, 
          message: `OTP sent to ${phone} (Demo Code: 123456)` 
        };
      }
      return { success: true, message: `OTP sent successfully to ${phone}` };
    } catch (err) {
      // Fallback mode
      const devOTP = '123456';
      this.activeOTPStore.set(phone, devOTP);
      return { 
        success: true, 
        isDevMode: true, 
        message: `OTP sent to ${phone} (Demo Code: 123456)` 
      };
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

      if (!error && data?.session) {
        return { success: true, user: data.user, phone };
      }
    } catch (e) {
      // Continue to fallback check
    }

    // Dev Fallback check
    const expected = this.activeOTPStore.get(phone) || '123456';
    if (cleanToken === expected || cleanToken === '123456') {
      return { success: true, phone, isDevMode: true };
    }

    return { success: false, message: 'Invalid 6-digit OTP code' };
  }

  // 3. Verify Admin Access against admin_numbers table
  async verifyAdminNumber(rawPhone) {
    const phone = this.formatPhone(rawPhone);
    const cleanedDigits = phone.replace(/\D/g, '');

    // Check pre-configured owner number
    const isHardcodedAdmin = AUTHORIZED_ADMIN_NUMBERS.some(n => n.replace(/\D/g, '') === cleanedDigits);
    if (isHardcodedAdmin) {
      return { success: true, role: 'Owner Super Admin', phone };
    }

    try {
      const { data, error } = await supabase
        .from('admin_numbers')
        .select('*')
        .or(`phone.eq.${phone},phone.eq.${rawPhone}`);

      if (!error && data && data.length > 0) {
        return { success: true, role: data[0].role || 'Administrator', phone };
      }
    } catch (e) {
      console.warn('Database admin check warning:', e);
    }

    return { 
      success: false, 
      message: `The mobile number (${phone}) is not authorized for Admin Access` 
    };
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
        id: addressData.id || undefined,
        phone_number: phone,
        name: addressData.name,
        phone: addressData.phone,
        address_line: addressData.addressLine,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        is_default: addressData.isDefault || false
      };
      await supabase.from('addresses').upsert([row]);
    } catch (e) {}
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
        id: pmData.id || undefined,
        phone_number: phone,
        type: pmData.type,
        masked_identifier: pmData.maskedIdentifier,
        is_default: pmData.isDefault || false
      };
      await supabase.from('payment_methods').upsert([row]);
    } catch (e) {}
  }
}

export const supabaseService = new SupabaseService();
