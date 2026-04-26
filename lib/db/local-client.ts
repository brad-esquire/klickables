/**
 * SQLite mock that implements the Supabase JS client chainable query API.
 * Used for local development — set USE_LOCAL_DB=true in .env.local.
 * All pages and API routes work unchanged.
 */

import Database from 'better-sqlite3'
import path from 'path'

// ─── Relationship map ─────────────────────────────────────────────────────────
// Tells the mock how to resolve Supabase-style embedded relations like
// select('*, product_variants(*)')
type RelationDef = { table: string; fk: string; isArray: boolean }

const RELATIONS: Record<string, Record<string, RelationDef>> = {
  products: {
    product_variants: { table: 'product_variants', fk: 'product_id', isArray: true },
  },
  product_variants: {
    products: { table: 'products', fk: 'product_id', isArray: false },
  },
  orders: {
    order_items: { table: 'order_items', fk: 'order_id', isArray: true },
    payment_events: { table: 'payment_events', fk: 'order_id', isArray: true },
  },
  order_items: {
    orders: { table: 'orders', fk: 'order_id', isArray: false },
  },
  payment_events: {
    orders: { table: 'orders', fk: 'order_id', isArray: false },
  },
}

// Fields stored as JSON text that need parsing on read
const JSON_FIELDS: Record<string, string[]> = {
  orders: ['shipping_address'],
  products: ['images'],
}

// Fields stored as 0/1 integers that need coercion to boolean
const BOOL_FIELDS: Record<string, string[]> = {
  products: ['active'],
  discount_codes: ['active'],
}

// ─── DB singleton ─────────────────────────────────────────────────────────────
let _db: Database.Database | null = null

export function getLocalDb(): Database.Database {
  if (!_db) {
    const dbPath = process.env.LOCAL_DB_PATH ?? path.join(process.cwd(), 'local.db')
    _db = new Database(dbPath)
    _db.pragma('foreign_keys = ON')
    _db.pragma('journal_mode = WAL')
    // Register UUID generator so DEFAULT (gen_random_uuid()) works in schema
    _db.function('gen_random_uuid', () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
    )
  }
  return _db
}

// ─── Type coercion helpers ────────────────────────────────────────────────────
function coerceRow(
  table: string,
  row: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!row) return null
  const r = { ...row }

  for (const f of JSON_FIELDS[table] ?? []) {
    if (typeof r[f] === 'string') {
      try {
        r[f] = JSON.parse(r[f] as string)
      } catch {}
    }
  }
  for (const f of BOOL_FIELDS[table] ?? []) {
    if (r[f] !== undefined) r[f] = r[f] === 1 || r[f] === true
  }
  return r
}

function prepareValue(val: unknown): unknown {
  if (val === true) return 1
  if (val === false) return 0
  if (val instanceof Date) return val.toISOString()
  if (Array.isArray(val)) return JSON.stringify(val)
  if (typeof val === 'object' && val !== null) return JSON.stringify(val)
  return val
}

// ─── Result type ──────────────────────────────────────────────────────────────
interface DbResult<T = unknown> {
  data: T | null
  error: { message: string } | null
  count?: number | null
}

// ─── Query builder ────────────────────────────────────────────────────────────
type ConditionType = 'eq' | 'neq' | 'in' | 'lte' | 'gt' | 'gte'
type Condition = { type: ConditionType; col: string; val: unknown }

export class QueryBuilder {
  private readonly _db: Database.Database
  private readonly _table: string
  private _cols = '*'
  private _embeds: Array<{ name: string; cols: string }> = []
  private _conditions: Condition[] = []
  private _order?: { col: string; asc: boolean }
  private _limit?: number
  private _isSingle = false
  private _isMaybe = false
  private _isCount = false
  private _action?: 'insert' | 'update' | 'delete' | 'upsert'
  private _actionData?: Record<string, unknown> | Record<string, unknown>[]
  private _returning = false

  constructor(db: Database.Database, table: string) {
    this._db = db
    this._table = table
  }

  select(cols = '*', opts?: { count?: 'exact'; head?: boolean }): this {
    if (opts?.count === 'exact') {
      this._isCount = true
      return this
    }
    // If called after insert/update, it means "return the row"
    if (this._action) {
      this._returning = true
      return this
    }
    // Parse embedded relations: "*, product_variants(*)"
    const colParts: string[] = []
    const embedParts: Array<{ name: string; cols: string }> = []
    for (const part of cols.split(',').map((s) => s.trim())) {
      const m = part.match(/^(\w+)\(([^)]*)\)$/)
      if (m) embedParts.push({ name: m[1], cols: m[2] })
      else colParts.push(part)
    }
    this._cols = colParts.join(', ') || '*'
    this._embeds = embedParts
    return this
  }

  eq(col: string, val: unknown): this {
    this._conditions.push({ type: 'eq', col, val })
    return this
  }
  neq(col: string, val: unknown): this {
    this._conditions.push({ type: 'neq', col, val })
    return this
  }
  in(col: string, vals: unknown[]): this {
    this._conditions.push({ type: 'in', col, val: vals })
    return this
  }
  lte(col: string, val: unknown): this {
    this._conditions.push({ type: 'lte', col, val })
    return this
  }
  gt(col: string, val: unknown): this {
    this._conditions.push({ type: 'gt', col, val })
    return this
  }
  gte(col: string, val: unknown): this {
    this._conditions.push({ type: 'gte', col, val })
    return this
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this._order = { col, asc: opts?.ascending ?? true }
    return this
  }
  limit(n: number): this {
    this._limit = n
    return this
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this._action = 'insert'
    this._actionData = Array.isArray(data) ? data : [data]
    return this
  }
  update(data: Record<string, unknown>): this {
    this._action = 'update'
    this._actionData = data
    return this
  }
  delete(): this {
    this._action = 'delete'
    return this
  }
  upsert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this._action = 'upsert'
    this._actionData = Array.isArray(data) ? data : [data]
    return this
  }

  single(): Promise<DbResult> {
    this._isSingle = true
    return this._execute()
  }
  maybeSingle(): Promise<DbResult> {
    this._isMaybe = true
    return this._execute()
  }

  // Makes the builder awaitable without calling .single()
  then<T>(resolve: (v: DbResult) => T, reject?: (e: unknown) => T): Promise<T> {
    return this._execute().then(resolve, reject)
  }

  private _where(): { sql: string; params: unknown[] } {
    if (!this._conditions.length) return { sql: '', params: [] }
    const parts: string[] = []
    const params: unknown[] = []
    for (const c of this._conditions) {
      const col = `"${c.col}"`
      switch (c.type) {
        case 'eq':
          parts.push(`${col} = ?`)
          params.push(c.val === true ? 1 : c.val === false ? 0 : c.val)
          break
        case 'neq':
          parts.push(`${col} != ?`)
          params.push(c.val)
          break
        case 'in': {
          const vs = c.val as unknown[]
          if (!vs.length) { parts.push('0'); break }
          parts.push(`${col} IN (${vs.map(() => '?').join(', ')})`)
          params.push(...vs)
          break
        }
        case 'lte':
          parts.push(`${col} <= ?`)
          params.push(c.val)
          break
        case 'gt':
          parts.push(`${col} > ?`)
          params.push(c.val)
          break
        case 'gte':
          parts.push(`${col} >= ?`)
          params.push(c.val)
          break
      }
    }
    return { sql: `WHERE ${parts.join(' AND ')}`, params }
  }

  private _resolveEmbeds(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    if (!this._embeds.length || !rows.length) return rows
    const tableRels = RELATIONS[this._table] ?? {}

    for (const embed of this._embeds) {
      const rel = tableRels[embed.name]
      if (!rel) continue

      if (rel.isArray) {
        // one-to-many: fetch children grouped by parent id
        const ids = rows.map((r) => r.id).filter(Boolean)
        if (!ids.length) { rows.forEach((r) => { r[embed.name] = [] }); continue }
        const ph = ids.map(() => '?').join(', ')
        const children = (
          this._db.prepare(`SELECT * FROM "${rel.table}" WHERE "${rel.fk}" IN (${ph})`).all(...ids) as Record<string, unknown>[]
        ).map((r) => coerceRow(rel.table, r)!)
        for (const row of rows) {
          row[embed.name] = children.filter((c) => c[rel.fk] === row.id)
        }
      } else {
        // many-to-one: fetch parents
        const fkVals = [...new Set(rows.map((r) => r[rel.fk]).filter(Boolean))]
        if (!fkVals.length) { rows.forEach((r) => { r[embed.name] = null }); continue }
        const ph = fkVals.map(() => '?').join(', ')
        const parents = (
          this._db.prepare(`SELECT * FROM "${rel.table}" WHERE id IN (${ph})`).all(...fkVals) as Record<string, unknown>[]
        ).map((r) => coerceRow(rel.table, r)!)

        const embedCols =
          embed.cols === '*' ? null : embed.cols.split(',').map((s) => s.trim())

        for (const row of rows) {
          const parent = parents.find((p) => p.id === row[rel.fk]) ?? null
          if (parent && embedCols) {
            const filtered: Record<string, unknown> = {}
            for (const c of embedCols) filtered[c] = parent[c]
            row[embed.name] = filtered
          } else {
            row[embed.name] = parent
          }
        }
      }
    }
    return rows
  }

  private async _execute(): Promise<DbResult> {
    try {
      const db = this._db
      const { sql: whereSql, params: whereParams } = this._where()

      // COUNT
      if (this._isCount) {
        const row = db
          .prepare(`SELECT COUNT(*) as cnt FROM "${this._table}" ${whereSql}`)
          .get(...whereParams) as { cnt: number }
        return { data: null, error: null, count: row.cnt }
      }

      // INSERT / UPSERT
      if (this._action === 'insert' || this._action === 'upsert') {
        const rows = this._actionData as Record<string, unknown>[]
        const or = this._action === 'upsert' ? 'OR REPLACE ' : ''
        let lastRow: Record<string, unknown> | null = null
        for (const row of rows) {
          const cols = Object.keys(row)
          const vals = cols.map((c) => prepareValue(row[c]))
          const res = db
            .prepare(
              `INSERT ${or}INTO "${this._table}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
            )
            .run(...vals)
          if (this._returning || this._isSingle) {
            lastRow = coerceRow(
              this._table,
              db
                .prepare(`SELECT * FROM "${this._table}" WHERE rowid = ?`)
                .get(res.lastInsertRowid) as Record<string, unknown> | null
            )
          }
        }
        if (this._isSingle || this._returning) return { data: lastRow, error: null }
        return { data: null, error: null }
      }

      // UPDATE
      if (this._action === 'update') {
        const data = this._actionData as Record<string, unknown>
        const setCols = Object.keys(data)
        const setVals = setCols.map((c) => prepareValue(data[c]))
        db.prepare(
          `UPDATE "${this._table}" SET ${setCols.map((c) => `"${c}" = ?`).join(', ')} ${whereSql}`
        ).run(...setVals, ...whereParams)
        return { data: null, error: null }
      }

      // DELETE
      if (this._action === 'delete') {
        db.prepare(`DELETE FROM "${this._table}" ${whereSql}`).run(...whereParams)
        return { data: null, error: null }
      }

      // SELECT
      let sql = `SELECT ${this._cols} FROM "${this._table}" ${whereSql}`
      if (this._order) sql += ` ORDER BY "${this._order.col}" ${this._order.asc ? 'ASC' : 'DESC'}`
      if (this._limit) sql += ` LIMIT ${this._limit}`

      if (this._isSingle || this._isMaybe) {
        const row = db.prepare(sql + ' LIMIT 1').get(...whereParams) as Record<string, unknown> | null
        if (this._isSingle && !row) return { data: null, error: { message: 'Row not found' } }
        const coerced = coerceRow(this._table, row)
        const withEmbeds = coerced ? this._resolveEmbeds([coerced]) : []
        return { data: withEmbeds[0] ?? null, error: null }
      }

      const rows = (db.prepare(sql).all(...whereParams) as Record<string, unknown>[]).map(
        (r) => coerceRow(this._table, r)!
      )
      return { data: this._resolveEmbeds(rows), error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : String(err) } }
    }
  }
}

// ─── Client factory ───────────────────────────────────────────────────────────
export function createLocalClient() {
  const db = getLocalDb()
  return {
    from: (table: string) => new QueryBuilder(db, table),
    // rpc is a no-op for local dev (we use direct SQL instead)
    rpc: () => Promise.resolve({ data: null, error: null }),
  }
}
