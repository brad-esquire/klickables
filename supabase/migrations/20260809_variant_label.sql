-- Products can relabel their primary variant axis. Most products vary by
-- "Color" (the default), but some use a different concept — e.g. Name Plates
-- vary by number of letters. The label drives the storefront heading and the
-- admin variant field label; the underlying value still lives in variants.color.
ALTER TABLE products
  ADD COLUMN variant_label text NOT NULL DEFAULT 'Color';
