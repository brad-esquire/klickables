-- Per-product list of emojis offered to buyers in the personalization picker.
-- Empty array = text only (no emoji palette).
ALTER TABLE products
  ADD COLUMN personalization_emojis text[] NOT NULL DEFAULT '{}';
