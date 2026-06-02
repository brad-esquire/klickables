-- Per-product personalization (free-form text the buyer enters at checkout,
-- e.g. initials on a letter clicker) and per-item storage of that text.
ALTER TABLE products
  ADD COLUMN personalization_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN personalization_max_length integer NOT NULL DEFAULT 20;

ALTER TABLE order_items
  ADD COLUMN personalization_text text;
