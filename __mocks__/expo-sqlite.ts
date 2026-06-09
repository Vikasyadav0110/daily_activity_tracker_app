/**
 * In-memory mock for expo-sqlite.
 * Stores tables as Map<string, Map<number, Record<string, unknown>>>.
 * Supports the async API surface used by our repos.
 */

interface Row extends Record<string, unknown> {}

class InMemoryDB {
  private tables: Map<string, Row[]> = new Map();
  private sequences: Map<string, number> = new Map();
  private tableDefaults: Map<string, Row> = new Map();
  private uniqueKeys: Map<string, string[][]> = new Map(); // table → array of unique key groups
  private userVersion = 0;

  reset() {
    this.tables.clear();
    this.sequences.clear();
    this.tableDefaults.clear();
    this.uniqueKeys.clear();
    this.userVersion = 0;
  }

  private getTable(name: string): Row[] {
    if (!this.tables.has(name)) this.tables.set(name, []);
    return this.tables.get(name)!;
  }

  private nextId(table: string): number {
    const n = (this.sequences.get(table) ?? 0) + 1;
    this.sequences.set(table, n);
    return n;
  }

  // Parse very simple SQL INSERT / SELECT / UPDATE / DELETE / PRAGMA / ALTER
  async execAsync(sql: string): Promise<void> {
    const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await this._exec(stmt);
    }
  }

  private async _exec(sql: string): Promise<void> {
    const upper = sql.toUpperCase().trimStart();

    if (upper.startsWith('PRAGMA USER_VERSION')) {
      const m = sql.match(/PRAGMA\s+user_version\s*=\s*(\d+)/i);
      if (m) this.userVersion = parseInt(m[1], 10);
      return;
    }
    if (upper.startsWith('PRAGMA')) return;
    if (upper.startsWith('CREATE TABLE IF NOT EXISTS') || upper.startsWith('CREATE TABLE')) {
      const nameMatch = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
      if (nameMatch) {
        const tableName = nameMatch[1];
        this.getTable(tableName);
        const defaults: Row = {};
        // Extract each line between the outer parens; split on newlines then commas
        const bodyStart = sql.indexOf('(');
        const bodyEnd = sql.lastIndexOf(')');
        const uniqueGroups: string[][] = [];
        if (bodyStart >= 0 && bodyEnd > bodyStart) {
          const body = sql.slice(bodyStart + 1, bodyEnd);
          const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
          for (const line of lines) {
            // Match: col_name TYPE ... DEFAULT scalar_value (not a function call)
            const m = line.match(/^(\w+)\s+\S+[^,]*\bDEFAULT\s+(?!\()(\S+)/i);
            if (m) {
              const col = m[1];
              const rawDefault = m[2].replace(/[',]/g, '');
              if (rawDefault === '0') defaults[col] = 0;
              else if (rawDefault === '1') defaults[col] = 1;
              else defaults[col] = rawDefault;
            }
            // Parse UNIQUE constraints: UNIQUE(col1, col2)
            const uMatch = line.match(/^UNIQUE\s*\(([^)]+)\)/i);
            if (uMatch) {
              uniqueGroups.push(uMatch[1].split(',').map((c) => c.trim()));
            }
          }
        }
        this.tableDefaults.set(tableName, defaults);
        if (uniqueGroups.length > 0) this.uniqueKeys.set(tableName, uniqueGroups);
      }
      return;
    }
    if (upper.startsWith('CREATE INDEX')) return;
    if (upper.startsWith('INSERT OR IGNORE INTO')) {
      const m = sql.match(/INSERT OR IGNORE INTO (\w+)\s*\([^)]+\)\s*VALUES/i);
      if (m) {
        const table = m[1];
        // Only seed if table is empty
        if (this.getTable(table).length === 0) {
          await this.runAsync(sql.replace(/OR\s+IGNORE\s+/i, ''), []);
        }
      }
      return;
    }
    if (upper.startsWith('ALTER TABLE')) {
      // ALTER TABLE t ADD COLUMN col_name TYPE DEFAULT val
      const m = sql.match(/ALTER TABLE (\w+) ADD COLUMN (\w+) (\S+)(?: NOT NULL)?(?: DEFAULT (.+))?/i);
      if (m) {
        const [, tableName, colName, , defaultVal] = m;
        const rows = this.getTable(tableName);
        const parsed = defaultVal?.replace(/'/g, '') ?? null;
        rows.forEach((r) => { if (!(colName in r)) r[colName] = parsed; });
      }
      return;
    }
    // other DDL: ignore
  }

  async runAsync(sql: string, params: (string | number | null)[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    const upper = sql.toUpperCase().trimStart();
    let p = [...params];
    const fillParam = () => p.shift() ?? null;

    if (upper.startsWith('INSERT OR REPLACE INTO') || upper.startsWith('INSERT OR IGNORE INTO') || upper.startsWith('INSERT INTO')) {
      const m = sql.match(/INSERT\s+(?:OR (?:REPLACE|IGNORE) )?INTO\s+(\w+)\s*\(([^)]+)\)/i);
      if (!m) return { lastInsertRowId: 0, changes: 0 };
      const tableName = m[1];
      const cols = m[2].split(',').map((c) => c.trim());
      const row: Row = {};
      // Extract VALUES literals if params array is empty
      const valuesMatch = sql.match(/VALUES\s*\((.+)\)\s*$/is);
      const literalValues: (string | number | null)[] = [];
      if (valuesMatch && p.length === 0) {
        const raw = valuesMatch[1];
        raw.split(',').forEach((v) => {
          const t = v.trim();
          if (t === 'NULL' || t === 'null') literalValues.push(null);
          else if (/^'\s*(.*)\s*'$/.test(t)) literalValues.push(t.slice(1, -1));
          else if (!isNaN(Number(t))) literalValues.push(Number(t));
          else literalValues.push(t.replace(/'/g, ''));
        });
      }
      const useLiterals = literalValues.length > 0;
      cols.forEach((c) => { row[c] = useLiterals ? (literalValues.shift() ?? null) : fillParam(); });

      const rows = this.getTable(tableName);

      // Handle OR REPLACE: check unique constraints (id or table-level UNIQUE)
      if (upper.startsWith('INSERT OR REPLACE')) {
        let idx = -1;
        if (row['id'] !== undefined && row['id'] !== null) {
          idx = rows.findIndex((r) => r['id'] === row['id']);
        }
        if (idx < 0) {
          // Check table-level UNIQUE constraints
          const uniqueGroups = this.uniqueKeys.get(tableName) ?? [];
          for (const group of uniqueGroups) {
            if (group.every((col) => col in row)) {
              const found = rows.findIndex((r) => group.every((col) => r[col] === row[col]));
              if (found >= 0) { idx = found; break; }
            }
          }
        }
        if (idx >= 0) {
          const existing = rows[idx];
          rows[idx] = { ...existing, ...row, id: existing['id'], created_at: existing['created_at'], updated_at: new Date().toISOString() };
          return { lastInsertRowId: existing['id'] as number, changes: 1 };
        }
      }
      // Handle OR IGNORE: skip if id conflict
      if (upper.startsWith('INSERT OR IGNORE') && row['id'] !== undefined) {
        const exists = rows.some((r) => r['id'] === row['id']);
        if (exists) return { lastInsertRowId: row['id'] as number, changes: 0 };
      }

      // Apply table column defaults for columns not present in INSERT
      const defs = this.tableDefaults.get(tableName) ?? {};
      for (const [col, val] of Object.entries(defs)) {
        if (!(col in row)) row[col] = val;
      }
      if (!row['id']) row['id'] = this.nextId(tableName);
      if (!row['created_at']) row['created_at'] = new Date().toISOString();
      if (!row['updated_at']) row['updated_at'] = new Date().toISOString();
      rows.push(row);
      return { lastInsertRowId: row['id'] as number, changes: 1 };
    }

    if (upper.startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE\s+(\w+)\s+SET/i);
      if (!tableMatch) return { lastInsertRowId: 0, changes: 0 };
      const tableName = tableMatch[1];
      const rows = this.getTable(tableName);
      const setMatch = sql.match(/SET\s+(.+?)\s+WHERE\s+(.+)/is);
      if (!setMatch) return { lastInsertRowId: 0, changes: 0 };

      const setParts = setMatch[1].split(',').map((s) => s.trim());
      const wherePart = setMatch[2].trim();

      const updates: Row = {};
      for (const part of setParts) {
        const [col, valExpr] = part.split('=').map((s) => s.trim());
        if (col.includes('(')) continue; // skip function-named columns
        if (valExpr && valExpr.includes('(')) {
          // datetime('now') etc. — no param consumed, set to current time
          if (col === 'updated_at' || col === 'created_at') updates[col] = new Date().toISOString();
          continue;
        }
        updates[col] = fillParam();
      }
      if (!updates['updated_at']) updates['updated_at'] = new Date().toISOString();

      const whereCol = wherePart.split('=')[0].trim();
      const whereVal = fillParam();

      let changes = 0;
      rows.forEach((r) => {
        const match = r[whereCol] == whereVal;
        if (match) {
          Object.assign(r, updates);
          changes++;
        }
      });
      return { lastInsertRowId: 0, changes };
    }

    if (upper.startsWith('DELETE FROM')) {
      const m = sql.match(/DELETE FROM\s+(\w+)\s+WHERE\s+(.+)/i);
      if (!m) return { lastInsertRowId: 0, changes: 0 };
      const rows = this.getTable(m[1]);
      const conditions = m[2].split('AND').map((c) => c.trim());
      const before = rows.length;
      const keep = rows.filter((r) => {
        return conditions.some((cond) => {
          const [col] = cond.split('=').map((s) => s.trim());
          const val = fillParam();
          return r[col] != val;
        });
      });
      this.tables.set(m[1], keep);
      return { lastInsertRowId: 0, changes: before - keep.length };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, params: (string | number | null)[] = []): Promise<T | null> {
    const rows = await this._select<T>(sql, params);
    return rows[0] ?? null;
  }

  async getAllAsync<T>(sql: string, params: (string | number | null)[] = []): Promise<T[]> {
    return this._select<T>(sql, params);
  }

  private async _select<T>(sql: string, params: (string | number | null)[]): Promise<T[]> {
    const upper = sql.toUpperCase().trimStart();
    let p = [...params];

    if (upper.startsWith('PRAGMA USER_VERSION')) {
      return [{ user_version: this.userVersion } as unknown as T];
    }
    if (upper.startsWith('PRAGMA')) return [];

    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return [];
    const tableName = tableMatch[1];
    let rows = [...this.getTable(tableName)];

    // WHERE
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/is);
    if (whereMatch) {
      const conditions = whereMatch[1].trim();
      const parts = conditions.split(/\s+AND\s+/i);
      for (const part of parts) {
        const eqMatch = part.match(/(\w+)\s*=\s*\?/);
        const neqMatch = part.match(/(\w+)\s*!=\s*\?/);
        const isNullMatch = part.match(/(\w+)\s+IS\s+NULL/i);
        const isNotNullMatch = part.match(/(\w+)\s+IS\s+NOT\s+NULL/i);
        const gteMatch = part.match(/(\w+)\s*>=\s*\?/);
        const lteMatch = part.match(/(\w+)\s*<=\s*\?/);

        if (eqMatch) {
          const val = p.shift() ?? null;
          rows = rows.filter((r) => r[eqMatch[1]] == val);
        } else if (neqMatch) {
          const val = p.shift() ?? null;
          rows = rows.filter((r) => r[neqMatch[1]] != val);
        } else if (isNullMatch) {
          rows = rows.filter((r) => r[isNullMatch[1]] === null || r[isNullMatch[1]] === undefined);
        } else if (isNotNullMatch) {
          rows = rows.filter((r) => r[isNotNullMatch[1]] !== null && r[isNotNullMatch[1]] !== undefined);
        } else if (gteMatch) {
          const val = p.shift() ?? null;
          rows = rows.filter((r) => (r[gteMatch[1]] as string) >= (val as string));
        } else if (lteMatch) {
          const val = p.shift() ?? null;
          rows = rows.filter((r) => (r[lteMatch[1]] as string) <= (val as string));
        }
      }
    }

    // ORDER BY
    const orderMatch = sql.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const col = orderMatch[1];
      const dir = orderMatch[2]?.toUpperCase() ?? 'ASC';
      rows.sort((a, b) => {
        const av = a[col] as string;
        const bv = b[col] as string;
        return dir === 'ASC' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }

    // LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\?|\d+)/i);
    if (limitMatch) {
      const limit = limitMatch[1] === '?' ? (p.shift() as number) : parseInt(limitMatch[1], 10);
      rows = rows.slice(0, limit);
    }

    return rows as unknown as T[];
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }
}

const mockDb = new InMemoryDB();

export const openDatabaseAsync = jest.fn(() => Promise.resolve(mockDb));
export const __mockDb = mockDb; // exported for test teardown/reset
