-- Admin-controlled ordering for a product's variant options (and their rows).
-- All rows sharing a variant_name carry the same sort_order = the option's
-- position; the storefront and admin order variant options by it.
ALTER TABLE product_variants
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
