-- Active flag for product variants: admin can hide a variant from the storefront
-- without deleting it (so historical orders keep their reference).
ALTER TABLE product_variants
  ADD COLUMN active boolean NOT NULL DEFAULT true;
