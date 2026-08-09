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

// Common emoji names so admins can type "heart" instead of hunting for the
// glyph. Keys are lowercase; aliases point at the same emoji. Not exhaustive —
// pasted glyphs still work for anything not listed here.
const EMOJI_NAMES: Record<string, string> = {
  heart: '❤️', hearts: '💕', 'blue heart': '💙', 'green heart': '💚',
  'yellow heart': '💛', 'purple heart': '💜', 'black heart': '🖤', 'broken heart': '💔',
  star: '⭐', stars: '🌟', sparkle: '✨', sparkles: '✨', glitter: '✨',
  moon: '🌙', sun: '☀️', cloud: '☁️', rainbow: '🌈', snowflake: '❄️', snow: '❄️',
  fire: '🔥', flame: '🔥', lightning: '⚡', bolt: '⚡', water: '💧', drop: '💧',
  flower: '🌸', blossom: '🌸', rose: '🌹', tulip: '🌷', sunflower: '🌻', leaf: '🍀', clover: '🍀',
  smile: '😀', happy: '😀', laugh: '😂', wink: '😉', cool: '😎', love: '😍', kiss: '😘',
  sad: '😢', cry: '😭', angry: '😠', heart_eyes: '😍',
  cat: '🐱', dog: '🐶', paw: '🐾', paws: '🐾', bear: '🐻', bunny: '🐰', rabbit: '🐰',
  unicorn: '🦄', butterfly: '🦋', bee: '🐝', fish: '🐠', turtle: '🐢', dino: '🦕', dinosaur: '🦖',
  crown: '👑', gem: '💎', diamond: '💎', ring: '💍', gift: '🎁', present: '🎁',
  cake: '🎂', balloon: '🎈', party: '🎉', confetti: '🎊', music: '🎵', note: '🎵', notes: '🎶',
  check: '✔️', tick: '✔️', cross: '❌', x: '❌', 'no': '🚫',
  thumbsup: '👍', 'thumbs up': '👍', thumbsdown: '👎', 'thumbs down': '👎', ok: '👌', wave: '👋',
  peace: '✌️', clap: '👏', pray: '🙏', muscle: '💪', point: '👉', rocket: '🚀', star2: '💫',
  soccer: '⚽', basketball: '🏀', football: '🏈', baseball: '⚾', trophy: '🏆', medal: '🏅',
  apple: '🍎', pizza: '🍕', burger: '🍔', icecream: '🍦', 'ice cream': '🍦', donut: '🍩', candy: '🍬',
  coffee: '☕', heartface: '🥰',
}

/**
 * Parse a free-form admin string into a deduped list of emoji. Accepts both
 * pasted glyphs ("❤️ ⭐") and typed names or :shortcodes: ("heart", ":star:").
 * Unrecognized plain-text tokens are dropped.
 */
export function parseEmojiList(input: string): string[] {
  if (!input) return []
  const out: string[] = []
  const seen = new Set<string>()
  const push = (emoji: string) => {
    if (emoji && !seen.has(emoji)) { seen.add(emoji); out.push(emoji) }
  }

  // Split on commas so multi-word names like "blue heart" stay intact, then try
  // each comma-chunk as a whole name, else fall back to space-separated tokens.
  for (const chunk of input.split(',')) {
    const trimmed = chunk.trim()
    if (!trimmed) continue
    const wholeName = EMOJI_NAMES[trimmed.replace(/^:|:$/g, '').toLowerCase()]
    if (wholeName) { push(wholeName); continue }

    for (const token of trimmed.split(/\s+/)) {
      if (!token) continue
      const named = EMOJI_NAMES[token.replace(/^:|:$/g, '').toLowerCase()]
      if (named) { push(named); continue }
      // Not a known name — keep any actual emoji graphemes, drop plain ASCII.
      for (const g of graphemes(token)) {
        if (!g.trim() || /^[\x20-\x7E]+$/.test(g)) continue
        push(g)
      }
    }
  }
  return out
}

// Split a string into grapheme clusters so multi-codepoint emoji (ZWJ,
// variation selectors) stay whole.
function graphemes(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return [...seg.segment(value)].map((s) => s.segment)
  }
  return Array.from(value)
}
