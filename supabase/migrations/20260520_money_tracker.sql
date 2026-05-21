-- Money Tracker: cash position + reimbursement ledger
-- Adds money_accounts (where money sits) and money_transactions (the ledger of movements).
-- Also adds cash_holder to orders and paid_from_account_id to expenses.

-- 1. Accounts (places where money sits)
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

-- 2. Ledger of every money movement
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

CREATE INDEX money_transactions_occurred_at_idx ON money_transactions(occurred_at DESC);
CREATE INDEX money_transactions_order_id_idx     ON money_transactions(order_id);
CREATE INDEX money_transactions_expense_id_idx   ON money_transactions(expense_id);
CREATE INDEX money_transactions_pe_id_idx        ON money_transactions(payment_event_id);
CREATE INDEX money_transactions_from_idx         ON money_transactions(from_account_id);
CREATE INDEX money_transactions_to_idx           ON money_transactions(to_account_id);

-- 3. Order changes: which person physically holds the cash (cash payments only)
ALTER TABLE orders ADD COLUMN cash_holder text;

-- 4. Expense changes: which account paid for this expense
ALTER TABLE expenses ADD COLUMN paid_from_account_id uuid REFERENCES money_accounts(id);

-- 5. Seed accounts
INSERT INTO money_accounts (name, kind, holder, default_fee_rate, default_fee_fixed, sort_order) VALUES
  ('Stripe',       'digital', NULL,      0,      0,    10),
  ('Venmo',        'digital', NULL,      0.0190, 0.10, 20),
  ('PayPal',       'digital', NULL,      0.0299, 0.49, 21),
  ('Zelle',        'digital', NULL,      0,      0,    22),
  ('Kirra cash',   'cash',    'Kirra',   0,      0,    30),
  ('Ashley cash',  'cash',    'Ashley',  0,      0,    31),
  ('Lorelei cash', 'cash',    'Lorelei', 0,      0,    32),
  ('Isla cash',    'cash',    'Isla',    0,      0,    33);

-- 6. RLS: service role only (no public access)
ALTER TABLE money_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;
