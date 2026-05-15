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

-- Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL
);