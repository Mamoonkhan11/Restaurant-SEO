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
