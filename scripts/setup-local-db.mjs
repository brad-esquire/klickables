/**
 * Sets up a fresh local SQLite database with schema + test data.
 * Run with: npm run db:setup
 */

import Database from 'better-sqlite3'
import { readFileSync, existsSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(process.cwd(), 'local.db')
const SCHEMA_PATH = join(__dirname, '../lib/db/sqlite-schema.sql')

// Fresh start
if (existsSync(DB_PATH)) {
  unlinkSync(DB_PATH)
  console.log('↺  Removed existing local.db')
}

const db = new Database(DB_PATH)
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

// Register UUID generator
db.function('gen_random_uuid', () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
)

// Create schema
const schema = readFileSync(SCHEMA_PATH, 'utf-8')
db.exec(schema)
console.log('✓  Schema created')

// ─── Seed data ────────────────────────────────────────────────────────────────
db.exec(`
  INSERT INTO settings (key, value) VALUES
    ('shipping_threshold', '50'),
    ('shipping_cost', '8.00');
`)

const insertProduct = db.prepare(
  `INSERT INTO products (id, name, slug, description, images, active) VALUES (?, ?, ?, ?, ?, 1)`
)
const insertVariant = db.prepare(
  `INSERT INTO product_variants (id, product_id, color, size, price, stock, sku) VALUES (?, ?, ?, ?, ?, ?, ?)`
)

const seedProducts = [
  {
    id: 'prod-001',
    name: 'Original Clicker',
    slug: 'original-clicker',
    desc: 'The original Klickables 3D printed clicker. Smooth, satisfying click every time.',
    variants: [
      ['var-001', 'Purple', null, 12.00, 10, 'OC-PUR'],
      ['var-002', 'Pink',   null, 12.00, 8,  'OC-PNK'],
      ['var-003', 'Blue',   null, 12.00, 5,  'OC-BLU'],
    ],
  },
  {
    id: 'prod-002',
    name: 'Mini Clicker',
    slug: 'mini-clicker',
    desc: 'A smaller version of our popular clicker — perfect for on-the-go clicking!',
    variants: [
      ['var-004', 'Purple', null, 9.00, 15, 'MC-PUR'],
      ['var-005', 'Pink',   null, 9.00, 12, 'MC-PNK'],
      ['var-006', 'Blue',   null, 9.00, 3,  'MC-BLU'],
    ],
  },
  {
    id: 'prod-003',
    name: 'Jumbo Clicker',
    slug: 'jumbo-clicker',
    desc: 'Our biggest clicker yet — maximum clickability.',
    variants: [
      ['var-007', 'Navy',   null, 15.00, 6, 'JC-NAV'],
      ['var-008', 'Purple', null, 15.00, 4, 'JC-PUR'],
    ],
  },
  {
    id: 'prod-004',
    name: 'Color Pack Clicker',
    slug: 'color-pack-clicker',
    desc: 'Can\'t choose? Get one in every color! Available in Small and Large.',
    variants: [
      ['var-009', 'Purple', 'Small',  14.00, 8,  'CP-PUR-S'],
      ['var-010', 'Purple', 'Large',  16.00, 6,  'CP-PUR-L'],
      ['var-011', 'Pink',   'Small',  14.00, 10, 'CP-PNK-S'],
      ['var-012', 'Pink',   'Large',  16.00, 7,  'CP-PNK-L'],
      ['var-013', 'Blue',   'Small',  14.00, 9,  'CP-BLU-S'],
      ['var-014', 'Blue',   'Large',  16.00, 5,  'CP-BLU-L'],
    ],
  },
]

const insertDiscount = db.prepare(
  `INSERT INTO discount_codes (id, code, type, value, min_order, max_uses, uses_count, active) VALUES (?, ?, ?, ?, ?, ?, 0, 1)`
)

for (const p of seedProducts) {
  insertProduct.run(p.id, p.name, p.slug, p.desc, '[]')
  for (const [id, color, size, price, stock, sku] of p.variants) {
    insertVariant.run(id, p.id, color, size, price, stock, sku)
  }
}

insertDiscount.run('disc-001', 'WELCOME10', 'percentage', 10, 0,  null)
insertDiscount.run('disc-002', 'SAVE5',     'fixed',      5,  20, 100)

console.log(`✓  Seeded ${seedProducts.length} products with variants`)
console.log('✓  Seeded 2 discount codes (WELCOME10, SAVE5)')
console.log('✓  Seeded shipping settings')
console.log('')
console.log(`Database ready at: ${DB_PATH}`)
console.log('')
console.log('Next: copy .env.local.example → .env.local then run: npm run dev')
