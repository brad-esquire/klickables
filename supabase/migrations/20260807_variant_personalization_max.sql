-- Per-variant override for personalization length. Nameplate variants like
-- "One Letter" / "Five Letter" need to cap the buyer's text to the number of
-- keys that variant provides. NULL means "fall back to the product-level
-- products.personalization_max_length".
ALTER TABLE product_variants
  ADD COLUMN personalization_max_length integer;
