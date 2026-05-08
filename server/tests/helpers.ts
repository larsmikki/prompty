// @ts-ignore
import initSqlJs from 'sql.js'

export async function createTestDb() {
  const SQL = await initSqlJs()
  const db = new SQL.Database()

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    image_path TEXT
  )`)

  // Seed default category (matches the initial migration)
  db.run(`INSERT INTO categories (id, name) VALUES ('general', 'General')`)

  return db
}
