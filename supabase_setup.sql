-- ===================================================
-- TEE MATRIX - Supabase Database Schema & Setup Script
-- Production-Grade Security & Least-Privilege RLS Migration
-- ===================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  fit TEXT,
  fabric TEXT,
  description TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  image_primary TEXT NOT NULL,
  image_hover TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  stock_qty INT DEFAULT 50,
  size_stock JSONB DEFAULT '{}'::jsonb,
  badge TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  model_image_type TEXT DEFAULT 'product_only',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure size_stock column exists if table was previously created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_stock JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS model_image_type TEXT DEFAULT 'product_only';

-- 3. Customer Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Authorized Admin Numbers Table
CREATE TABLE IF NOT EXISTS public.admin_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Administrator',
  role TEXT DEFAULT 'Super Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Initial Owner Admin Phone Number
INSERT INTO public.admin_numbers (phone, name, role)
VALUES ('+91 8593071292', 'Master Administrator', 'Owner Super Admin')
ON CONFLICT (phone) DO UPDATE SET role = 'Owner Super Admin';

INSERT INTO public.admin_numbers (phone, name, role)
VALUES ('+918593071292', 'Master Administrator', 'Owner Super Admin')
ON CONFLICT (phone) DO NOTHING;

-- 4b. Authorized Admin Emails Table (For Google OAuth / Gmail Admin Sign-In)
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Administrator',
  role TEXT DEFAULT 'Super Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Initial Authorized Admin Emails
INSERT INTO public.admin_emails (email, name, role)
VALUES 
  ('teematrixsupport@gmail.com', 'Tee Matrix Support', 'Owner Super Admin'),
  ('dilshad29052003@gmail.com', 'Dilshad Admin', 'Owner Super Admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- 5. Saved Customer Shipping Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Saved Payment Methods Table (Masked references only)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  type TEXT NOT NULL, -- 'UPI' | 'CARD'
  masked_identifier TEXT NOT NULL, -- e.g. 'user@okhdfcbank' or 'Visa ending in 4242'
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'Processing (Online Dispatch)',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (payment_status IN ('PENDING_PAYMENT', 'PAID', 'PENDING_VERIFICATION', 'COD_PENDING', 'FAILED')),
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all order columns and constraints exist if table previously existed
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

-- Add partial unique indexes for Razorpay IDs
CREATE UNIQUE INDEX IF NOT EXISTS orders_rzp_order_id_key
  ON public.orders (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_rzp_payment_id_key
  ON public.orders (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

-- 8. Atomic Product Stock Decrement Function
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id text,
  p_size text,
  p_qty int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_size_stock jsonb;
  v_curr_qty int;
  v_new_qty int;
  v_total_stock int;
BEGIN
  SELECT size_stock, stock_qty INTO v_size_stock, v_total_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_curr_qty := COALESCE((v_size_stock ->> p_size)::int, 0);
  IF v_curr_qty < p_qty THEN
    RETURN false;
  END IF;

  v_new_qty := v_curr_qty - p_qty;
  v_size_stock := jsonb_set(COALESCE(v_size_stock, '{}'::jsonb), ARRAY[p_size], to_jsonb(v_new_qty));
  v_total_stock := GREATEST(0, v_total_stock - p_qty);

  UPDATE public.products
  SET size_stock = v_size_stock,
      stock_qty = v_total_stock,
      in_stock = (v_total_stock > 0)
  WHERE id = p_product_id;

  RETURN true;
END;
$$;

-- Revoke execute from public/anon/authenticated; grant strictly to service_role
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(text, text, int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(text, text, int) TO service_role;

-- 9. Helper Security Functions for RLS
CREATE OR REPLACE FUNCTION public.jwt_phone_digits()
RETURNS text
LANGUAGE sql
STABLE AS $$
  SELECT regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Phone matching against admin_numbers
    (public.jwt_phone_digits() <> '' AND EXISTS (
      SELECT 1 FROM public.admin_numbers a
      WHERE regexp_replace(a.phone, '\D', '', 'g') = public.jwt_phone_digits()
    ))
    OR
    -- Email matching against authorized admin_emails or verified admin email claim
    (coalesce(nullif(auth.jwt() ->> 'email', ''), '') <> '' AND (
      EXISTS (
        SELECT 1 FROM public.admin_emails e
        WHERE lower(e.email) = lower(auth.jwt() ->> 'email')
      )
      OR lower(auth.jwt() ->> 'email') IN ('teematrixsupport@gmail.com', 'dilshad29052003@gmail.com')
    ))
  );
$$;

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 11. Drop all legacy policies first for clean, safe re-runs
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public write access to products" ON public.products;
DROP POLICY IF EXISTS "products public read" ON public.products;
DROP POLICY IF EXISTS "products admin write" ON public.products;

DROP POLICY IF EXISTS "Allow public read access to admin_numbers" ON public.admin_numbers;
DROP POLICY IF EXISTS "admin_numbers admin only" ON public.admin_numbers;

DROP POLICY IF EXISTS "admin_emails admin only" ON public.admin_emails;

DROP POLICY IF EXISTS "Allow public access to users" ON public.users;
DROP POLICY IF EXISTS "users own rows" ON public.users;

DROP POLICY IF EXISTS "Allow public access to addresses" ON public.addresses;
DROP POLICY IF EXISTS "addresses own rows" ON public.addresses;

DROP POLICY IF EXISTS "Allow public access to payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods own rows" ON public.payment_methods;

DROP POLICY IF EXISTS "Allow public access to orders" ON public.orders;
DROP POLICY IF EXISTS "orders own rows read" ON public.orders;

-- 12. Create Granular Least-Privilege Policies
-- products: Anonymous & Customers can SELECT; only Admin can INSERT/UPDATE/DELETE
CREATE POLICY "products public read" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products admin write" ON public.products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admin_numbers: strictly admin only, zero anonymous or customer visibility
CREATE POLICY "admin_numbers admin only" ON public.admin_numbers
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admin_emails: strictly admin only
CREATE POLICY "admin_emails admin only" ON public.admin_emails
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- users: own row only
CREATE POLICY "users own rows" ON public.users
  FOR ALL
  USING (regexp_replace(phone, '\D', '', 'g') = public.jwt_phone_digits() OR public.is_admin())
  WITH CHECK (regexp_replace(phone, '\D', '', 'g') = public.jwt_phone_digits() OR public.is_admin());

-- addresses: own rows only
CREATE POLICY "addresses own rows" ON public.addresses
  FOR ALL
  USING (regexp_replace(phone_number, '\D', '', 'g') = public.jwt_phone_digits() OR public.is_admin())
  WITH CHECK (regexp_replace(phone_number, '\D', '', 'g') = public.jwt_phone_digits() OR public.is_admin());

-- payment_methods: own rows only
CREATE POLICY "payment_methods own rows" ON public.payment_methods
  FOR ALL
  USING (regexp_replace(phone_number, '\D', '', 'g') = public.jwt_phone_digits() OR public.is_admin())
  WITH CHECK (regexp_replace(phone_number, '\D', '', 'g') = public.jwt_phone_digits() OR public.is_admin());

-- orders: SELECT on own rows only. Zero client INSERT / UPDATE / DELETE permissions.
-- All order writes must happen server-side via service_role key.
CREATE POLICY "orders own rows read" ON public.orders
  FOR SELECT
  USING (regexp_replace(phone_number, '\D', '', 'g') = public.jwt_phone_digits() OR public.is_admin());


-- ===================================================
-- 13. Authoritative Base Catalog Seeding
-- ===================================================
INSERT INTO public.products (id, name, category, price, fit, fabric, description, highlights, sizes, size_stock, colors, image_primary, image_hover, images, in_stock, stock_qty, badge, is_featured, is_new_arrival)
VALUES
(
  'tm-001',
  'Matrix Acid Wash Heavyweight Tee',
  'Acid Wash',
  1999.00,
  'Boxy Oversized Fit',
  '100% Combed Heavy Cotton',
  'Architectural silhouette engineered from vintage acid-washed cotton. Drop-shoulder construction with subtle back graphic detailing.',
  '["100% Combed Heavy Cotton", "Boxy Oversized Streetwear Fit", "Vintage Acid Garment Wash", "Drop-Shoulder Construction", "Double-Stitched Reinforced Hem", "Machine Washable"]'::jsonb,
  '["S", "M", "L", "XL"]'::jsonb,
  '{"S": 10, "M": 15, "L": 12, "XL": 8}'::jsonb,
  '["Charcoal", "Jet Black"]'::jsonb,
  'assets/tee_acid_wash.jpg',
  'assets/tee_acid_wash_hover.jpg',
  '["assets/tee_acid_wash.jpg", "assets/tee_acid_wash_hover.jpg", "assets/hero_banner.jpg", "assets/story_campaign.jpg"]'::jsonb,
  true,
  45,
  'BESTSELLER',
  true,
  true
),
(
  'tm-002',
  'Neo Cybernetic Graphic Tee',
  'Graphic',
  1899.00,
  'Relaxed Boxy Cut',
  '100% Organic Bio-Washed Cotton',
  'Minimalist dystopian typography printed on heavy off-white combed cotton. Double-stitched raw hem with ribbed collar.',
  '["100% Organic Bio-Washed Cotton", "Relaxed Boxy Cut", "High-Density Screenprint Detailing", "Ribbed Crew Neckline", "Soft & Breathable Texture", "Machine Washable"]'::jsonb,
  '["XS", "S", "M", "L", "XL"]'::jsonb,
  '{"XS": 5, "S": 8, "M": 10, "L": 7, "XL": 0}'::jsonb,
  '["Off-White", "Bone White"]'::jsonb,
  'assets/tee_cyberpunk.jpg',
  'assets/tee_model_white.jpg',
  '["assets/tee_cyberpunk.jpg", "assets/tee_model_white.jpg", "assets/story_campaign.jpg", "assets/tee_black_heavy.jpg"]'::jsonb,
  true,
  30,
  'NEW',
  true,
  true
),
(
  'tm-003',
  'Essential Heavyweight Monochrome Tee',
  'Heavyweight Minimal',
  1699.00,
  'Oversized Fit',
  '100% Premium Heavy Cotton',
  'Pure jet-black minimal essential. Premium heavy drape that retains shape after every wash. Clean neck tape and reinforced side seams.',
  '["100% Premium Heavy Cotton", "Architectural Oversized Fit", "Deep Jet Black Fade-Resistant Dye", "Reinforced Neck Taping", "Retains Shape After Wash", "Machine Washable"]'::jsonb,
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '{"S": 12, "M": 18, "L": 20, "XL": 10, "XXL": 0}'::jsonb,
  '["Jet Black"]'::jsonb,
  'assets/tee_black_heavy.jpg',
  'assets/hero_banner.jpg',
  '["assets/tee_black_heavy.jpg", "assets/hero_banner.jpg", "assets/story_campaign.jpg", "assets/tee_acid_wash_hover.jpg"]'::jsonb,
  true,
  60,
  'LIMITED',
  true,
  true
),
(
  'tm-004',
  'Brutalist Off-White Courtyard Tee',
  'Vintage',
  1799.00,
  'Drop Shoulder Fit',
  '100% Vintage Washed Cotton',
  'Architectural off-white oversized silhouette inspired by brutalist urban design. Ultra-soft touch with structured collar.',
  '["100% Vintage Washed Cotton", "Drop Shoulder Silhouette", "Brutalist Atelier Aesthetic", "Ultra-Soft Handfeel", "Comfort Round Collar", "Machine Washable"]'::jsonb,
  '["S", "M", "L", "XL"]'::jsonb,
  '{"S": 6, "M": 9, "L": 10, "XL": 0}'::jsonb,
  '["Off-White", "Cream"]'::jsonb,
  'assets/tee_model_white.jpg',
  'assets/tee_cyberpunk.jpg',
  '["assets/tee_model_white.jpg", "assets/tee_cyberpunk.jpg", "assets/hero_banner.jpg", "assets/tee_acid_wash.jpg"]'::jsonb,
  true,
  25,
  'NEW',
  false,
  true
),
(
  'tm-005',
  'Distortion Rebellion Acid Tee',
  'Acid Wash',
  2299.00,
  'Boxy Oversized',
  '100% Heavyweight Cotton',
  'Custom acid garment wash with distortion series screen print. Each piece has a unique vintage pattern.',
  '["100% Heavyweight Cotton", "Custom Hand Acid Garment Wash", "Unique Vintage Distress Pattern", "Boxy Streetwear Fit", "Half Sleeve Construction", "Machine Washable"]'::jsonb,
  '["M", "L", "XL"]'::jsonb,
  '{"M": 6, "L": 8, "XL": 4}'::jsonb,
  '["Charcoal Acid"]'::jsonb,
  'assets/tee_acid_wash_hover.jpg',
  'assets/tee_acid_wash.jpg',
  '["assets/tee_acid_wash_hover.jpg", "assets/tee_acid_wash.jpg", "assets/hero_banner.jpg", "assets/story_campaign.jpg"]'::jsonb,
  true,
  18,
  'EXCLUSIVE',
  true,
  false
),
(
  'tm-006',
  'Midnight Monochrome Atelier Tee',
  'Heavyweight Minimal',
  1799.00,
  'Relaxed Boxy',
  '100% Heavy Cotton',
  'Deep midnight black silhouette with clean minimalist aesthetics. Tailored for online fashion collectors.',
  '["100% Heavy Cotton", "Relaxed Boxy Atelier Cut", "Anti-Fading Midnight Black Dye", "Ribbed Round Neck", "Breathable All-Day Comfort", "Machine Washable"]'::jsonb,
  '["S", "M", "L", "XL"]'::jsonb,
  '{"S": 10, "M": 12, "L": 10, "XL": 8}'::jsonb,
  '["Midnight Black"]'::jsonb,
  'assets/story_campaign.jpg',
  'assets/hero_banner.jpg',
  '["assets/story_campaign.jpg", "assets/hero_banner.jpg", "assets/tee_black_heavy.jpg", "assets/tee_model_white.jpg"]'::jsonb,
  true,
  40,
  'LIMITED',
  false,
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  fit = EXCLUDED.fit,
  fabric = EXCLUDED.fabric,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  sizes = EXCLUDED.sizes,
  size_stock = EXCLUDED.size_stock,
  colors = EXCLUDED.colors,
  image_primary = EXCLUDED.image_primary,
  image_hover = EXCLUDED.image_hover,
  images = EXCLUDED.images,
  in_stock = EXCLUDED.in_stock,
  stock_qty = EXCLUDED.stock_qty,
  badge = EXCLUDED.badge,
  is_featured = EXCLUDED.is_featured,
  is_new_arrival = EXCLUDED.is_new_arrival;
