-- Klickables local SQLite schema
-- Run via: npm run db:setup

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  images TEXT DEFAULT '[]',
  active INTEGER DEFAULT 1,
  variant_label TEXT NOT NULL DEFAULT 'Color',
  personalization_enabled INTEGER NOT NULL DEFAULT 0,
  personalization_max_length INTEGER NOT NULL DEFAULT 20,
  personalization_emojis TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color TEXT,
  size TEXT,
  -- Priced variant axis value (e.g. "1 letter", "Baseball"). NULL = product has
  -- no variant axis. A row is one (color × variant_name) combination.
  variant_name TEXT,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  -- Overrides products.personalization_max_length for this variant when set
  -- (e.g. a "Three Letter" nameplate caps personalization at 3). NULL = inherit.
  personalization_max_length INTEGER
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
  payment_method TEXT,
  payment_method_other TEXT,
  sales_reps TEXT NOT NULL DEFAULT '[]',
  cash_holder TEXT,
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
  unit_price REAL NOT NULL,
  personalization_text TEXT
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
  paid_from_account_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS money_accounts (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('digital','cash','external')),
  holder TEXT,
  default_fee_rate REAL NOT NULL DEFAULT 0,
  default_fee_fixed REAL NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  date TEXT NOT NULL DEFAULT (date('now')),
  paid_from_account_id TEXT REFERENCES money_accounts(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS money_transactions (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  occurred_at TEXT NOT NULL DEFAULT (date('now')),
  kind TEXT NOT NULL CHECK(kind IN ('sale','expense','transfer','reimbursement','adjustment')),
  from_account_id TEXT REFERENCES money_accounts(id),
  to_account_id TEXT REFERENCES money_accounts(id),
  amount REAL NOT NULL CHECK(amount > 0),
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  expense_id TEXT REFERENCES expenses(id) ON DELETE SET NULL,
  payment_event_id TEXT REFERENCES payment_events(id) ON DELETE SET NULL,
  description TEXT,
  notes TEXT,
  manual_override INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed money accounts
INSERT OR IGNORE INTO money_accounts (id, name, kind, holder, default_fee_rate, default_fee_fixed, sort_order) VALUES
  ('seed-stripe',  'Stripe',       'digital', NULL,      0,      0,    10),
  ('seed-venmo',   'Venmo',        'digital', NULL,      0.019,  0.10, 20),
  ('seed-paypal',  'PayPal',       'digital', NULL,      0.0299, 0.49, 21),
  ('seed-zelle',   'Zelle',        'digital', NULL,      0,      0,    22),
  ('seed-kirra',   'Kirra cash',   'cash',    'Kirra',   0,      0,    30),
  ('seed-ashley',  'Ashley cash',  'cash',    'Ashley',  0,      0,    31),
  ('seed-lorelei', 'Lorelei cash', 'cash',    'Lorelei', 0,      0,    32),
  ('seed-isla',    'Isla cash',    'cash',    'Isla',    0,      0,    33);
