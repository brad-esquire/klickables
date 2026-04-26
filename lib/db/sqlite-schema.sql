-- Klickables local SQLite schema
-- Run via: npm run db:setup

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  images TEXT DEFAULT '[]',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color TEXT,
  size TEXT,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  stripe_payment_intent_id TEXT UNIQUE,
  email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal REAL,
  shipping_cost REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total REAL,
  discount_code TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  fulfilled_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  variant_id TEXT REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_label TEXT,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('percentage', 'fixed')),
  value REAL NOT NULL,
  min_order REAL DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  stripe_id TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
