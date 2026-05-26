-- Create the dishes table
CREATE TABLE IF NOT EXISTS dishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true NOT NULL,
  rating DECIMAL(3, 1),
  order_count INTEGER DEFAULT 0 NOT NULL,
  restaurant_slug TEXT NOT NULL
);

-- Add an index on restaurant_slug for faster queries since we filter by it often
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_slug ON dishes(restaurant_slug);

-- Additional Columns for restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS pending_discounts INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS digital_signature TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS total_scans INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Function to handle trial initialization
CREATE OR REPLACE FUNCTION initialize_trial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_started_at IS NULL THEN
    NEW.trial_started_at := timezone('utc'::text, now());
    NEW.trial_ends_at := timezone('utc'::text, now() + interval '60 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for trial initialization
DROP TRIGGER IF EXISTS tr_initialize_trial ON restaurants;
CREATE TRIGGER tr_initialize_trial
BEFORE INSERT ON restaurants
FOR EACH ROW
EXECUTE FUNCTION initialize_trial();

-- Function to safely increment total_scans
CREATE OR REPLACE FUNCTION increment_scans(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE restaurants 
  SET total_scans = COALESCE(total_scans, 0) + 1 
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  plan_tier TEXT DEFAULT 'basic',
  billing_cycle TEXT DEFAULT 'monthly',
  payment_gateway TEXT DEFAULT 'system_promo',
  description TEXT
);

-- Create Tables for Restaurant Table Management
CREATE TABLE public.tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    table_no VARCHAR(50) NOT NULL,
    qr_slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (restaurant_id, table_no)
);

-- Create Orders Table for Live KOT
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    table_no VARCHAR(50) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;