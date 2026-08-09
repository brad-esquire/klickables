// A product_variants row is one (variant_name × color) combination. Its
// human-readable label leads with the priced variant value and appends the
// color, e.g. "3 letters / Blue" — matching the admin inventory grid.
// `variant_name` supersedes the legacy `size` column; we fall back to `size`
// so old rows/orders still render.
export function variantLabel(v: {
  color?: string | null
  variant_name?: string | null
  size?: string | null
}): string {
  return [v.variant_name ?? v.size, v.color].filter(Boolean).join(' / ')
}
