-- Split the variant axis from the color axis. A product_variants row is now one
-- (color × variant) combination — its own SKU, stock, and price. `variant_name`
-- holds the priced axis value (e.g. "1 letter", "Baseball"); `color` holds the
-- cosmetic color. Either may be NULL. Price is set per variant and defaulted
-- equal across that variant's colors. `size` is legacy — its values are folded
-- into `variant_name` below.
ALTER TABLE product_variants
  ADD COLUMN variant_name text;

-- Fold any existing size axis into the new variant axis.
UPDATE product_variants SET variant_name = size WHERE variant_name IS NULL AND size IS NOT NULL AND size <> '';
