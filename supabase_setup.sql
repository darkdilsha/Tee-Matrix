-- ===================================================
-- TEE MATRIX - Supabase Database Schema & Setup Script
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
  sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  image_primary TEXT NOT NULL,
  image_hover TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  stock_qty INT DEFAULT 50,
  badge TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- Also insert without space for strict matching fallback
INSERT INTO public.admin_numbers (phone, name, role)
VALUES ('+918593071292', 'Master Administrator', 'Owner Super Admin')
ON CONFLICT (phone) DO NOTHING;

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
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'Processing (Online Dispatch)',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Public Access
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public write access to products" ON public.products FOR ALL USING (true);

CREATE POLICY "Allow public read access to admin_numbers" ON public.admin_numbers FOR SELECT USING (true);
CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow public access to addresses" ON public.addresses FOR ALL USING (true);
CREATE POLICY "Allow public access to payment_methods" ON public.payment_methods FOR ALL USING (true);
CREATE POLICY "Allow public access to orders" ON public.orders FOR ALL USING (true);
