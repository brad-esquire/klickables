-- Klickables database schema
-- Run this in your Supabase SQL editor to set up the database

-- Products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  images text[] DEFAULT '{}',
  active boolean DEFAULT true,
  ignore_stock boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product variants (color × size combinations)
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  color text,
  size text,
  price numeric(10,2) NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  sku text
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id text UNIQUE,
  email text NOT NULL,
  customer_name text NOT NULL,
  shipping_address jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric(10,2),
  shipping_cost numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2),
  discount_code text,
  created_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz
);

-- Order line items
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  product_name text NOT NULL,
  variant_label text,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL
);

-- Discount codes
CREATE TABLE discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric(10,2) NOT NULL,
  min_order numeric(10,2) DEFAULT 0,
  max_uses integer,
  uses_count integer DEFAULT 0,
  active boolean DEFAULT true,
  expires_at timestamptz
);

-- Payment events (history of charges and refunds)
CREATE TABLE payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  stripe_id text,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Site settings (key-value store)
CREATE TABLE settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Default shipping settings
INSERT INTO settings (key, value) VALUES
  ('shipping_threshold', '50'),
  ('shipping_cost', '8.00');

-- Row Level Security: allow service role full access, anon read-only on products/variants
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public can read active products and their variants
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "Public read variants" ON product_variants
  FOR SELECT USING (true);

CREATE POLICY "Public read settings" ON settings
  FOR SELECT USING (true);

-- Service role (used by API routes) has full access — handled via SUPABASE_SERVICE_ROLE_KEY
