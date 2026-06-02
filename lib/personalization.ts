// Buyers personalize a clicker by filling N "key" slots. Each slot is either
// a letter/digit/punctuation OR one of the emojis the admin has configured
// for that product. Free-form emoji entry is not allowed.

const ALLOWED_TEXT = /[A-Za-z0-9 '!?&.]/

/**
 * Splits an input string into discrete "key" tokens — letters, digits, allowed
 * punctuation, and emojis from `allowedEmojis`. Anything else (including
 * non-allowlisted emojis) is silently dropped. Result is truncated to `max`.
 */
export function tokenizePersonalization(value: string, allowedEmojis: string[], max: number): string[] {
  // Longest emoji first so multi-codepoint sequences win over their prefixes.
  const emojis = [...allowedEmojis].sort((a, b) => b.length - a.length)
  const tokens: string[] = []
  let i = 0
  while (i < value.length && tokens.length < max) {
    const matched = emojis.find((e) => value.startsWith(e, i))
    if (matched) {
      tokens.push(matched)
      i += matched.length
      continue
    }
    if (ALLOWED_TEXT.test(value[i])) {
      tokens.push(value[i])
      i++
      continue
    }
    i++
  }
  return tokens
}

/**
 * Parse a free-form admin string (e.g. pasted from an emoji picker) into a
 * deduped list of emoji grapheme clusters. Skips whitespace and ASCII text.
 */
export function parseEmojiList(input: string): string[] {
  if (!input) return []
  // Use Intl.Segmenter when available — it handles multi-codepoint emoji
  // sequences (ZWJ, variation selectors) correctly.
  const clusters: string[] = []
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    for (const s of seg.segment(input)) clusters.push(s.segment)
  } else {
    clusters.push(...Array.from(input))
  }
  const out: string[] = []
  const seen = new Set<string>()
  for (const c of clusters) {
    // Skip whitespace and basic ASCII text — only emojis/symbols make it through.
    if (!c.trim()) continue
    if (/^[\x20-\x7E]+$/.test(c)) continue
    if (seen.has(c)) continue
    seen.add(c)
    out.push(c)
  }
  return out
}
