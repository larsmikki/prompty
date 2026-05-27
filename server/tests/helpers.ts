// @ts-expect-error sql.js has no bundled types
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations')

export async function createTestDb() {
  const SQL = await initSqlJs()
  const db = new SQL.Database()

  // Run the same migrations as production so the test schema can't silently
  // drift. Avoids the trap of "feature works in tests but fails in prod"
  // (e.g. a new column the test helper forgot about).
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    db.run(sql)
  }

  return db
}
