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
  personalization_enabled boolean NOT NULL DEFAULT false,
  personalization_max_length integer NOT NULL DEFAULT 20,
  personalization_emojis text[] NOT NULL DEFAULT '{}',
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
  sku text,
  active boolean NOT NULL DEFAULT true
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
  payment_method text,
  payment_method_other text,
  sales_reps text[] NOT NULL DEFAULT '{}',
  cash_holder text,
  created_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz,
  tracking_number text,
  shipped_at timestamptz
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
  unit_price numeric(10,2) NOT NULL,
  customization jsonb,
  personalization_text text
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
  paid_from_account_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Money accounts: where the money sits (Stripe, Venmo, cash per person, external/personal accounts)
CREATE TABLE money_accounts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  kind               text NOT NULL CHECK (kind IN ('digital','cash','external')),
  holder             text,
  default_fee_rate   numeric(6,4) NOT NULL DEFAULT 0,
  default_fee_fixed  numeric(10,2) NOT NULL DEFAULT 0,
  archived           boolean NOT NULL DEFAULT false,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Expenses (for P&L tracking)
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  date date NOT NULL DEFAULT CURRENT_DATE,
  paid_from_account_id uuid REFERENCES money_accounts(id),
  created_at timestamptz DEFAULT now()
);

-- Money transactions: ledger of every movement (sales, expenses, transfers, reimbursements, adjustments)
CREATE TABLE money_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at      date NOT NULL DEFAULT CURRENT_DATE,
  kind             text NOT NULL CHECK (kind IN ('sale','expense','transfer','reimbursement','adjustment')),
  from_account_id  uuid REFERENCES money_accounts(id),
  to_account_id    uuid REFERENCES money_accounts(id),
  amount           numeric(10,2) NOT NULL CHECK (amount > 0),
  order_id         uuid REFERENCES orders(id) ON DELETE SET NULL,
  expense_id       uuid REFERENCES expenses(id) ON DELETE SET NULL,
  payment_event_id uuid REFERENCES payment_events(id) ON DELETE SET NULL,
  description      text,
  notes            text,
  manual_override  boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (from_account_id IS NOT NULL OR to_account_id IS NOT NULL),
  CHECK (from_account_id IS NULL OR to_account_id IS NULL OR from_account_id <> to_account_id)
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

-- Seed money accounts (Stripe, Venmo, PayPal, Zelle, four cash holders)
INSERT INTO money_accounts (name, kind, holder, default_fee_rate, default_fee_fixed, sort_order) VALUES
  ('Stripe',       'digital', NULL,      0,      0,    10),
  ('Venmo',        'digital', NULL,      0.0190, 0.10, 20),
  ('PayPal',       'digital', NULL,      0.0299, 0.49, 21),
  ('Zelle',        'digital', NULL,      0,      0,    22),
  ('Kirra cash',   'cash',    'Kirra',   0,      0,    30),
  ('Ashley cash',  'cash',    'Ashley',  0,      0,    31),
  ('Lorelei cash', 'cash',    'Lorelei', 0,      0,    32),
  ('Isla cash',    'cash',    'Isla',    0,      0,    33);

-- Row Level Security: allow service role full access, anon read-only on products/variants
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;

-- Public can read active products and their variants
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "Public read variants" ON product_variants
  FOR SELECT USING (true);

CREATE POLICY "Public read settings" ON settings
  FOR SELECT USING (true);

-- Service role (used by API routes) has full access — handled via SUPABASE_SERVICE_ROLE_KEY
