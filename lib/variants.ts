// A product_variants row is one (color × variant_name) combination. Its
// human-readable label joins the cosmetic color and the priced variant value,
// e.g. "Blue / 3 letters". `variant_name` supersedes the legacy `size` column;
// we fall back to `size` so old rows/orders still render.
export function variantLabel(v: {
  color?: string | null
  variant_name?: string | null
  size?: string | null
}): string {
  return [v.color, v.variant_name ?? v.size].filter(Boolean).join(' / ')
}
