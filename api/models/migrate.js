import { readFile } from 'node:fs/promises'

// Sama päivitys toimii myös jo käytössä olevaan Docker-tietokantaan.
// Transaktio ja lukko estävät puolikkaan tai kahdesti ajetun päivityksen.
export async function migrate(pool) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(62841501)')
    await client.query(`CREATE TABLE IF NOT EXISTS leffahaku_migrations (
      name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
    for (const name of ['001_accounts.sql']) {
      const { rows } = await client.query('SELECT name FROM leffahaku_migrations WHERE name = $1', [name])
      if (rows.length) continue
      await client.query(await readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8'))
      await client.query('INSERT INTO leffahaku_migrations (name) VALUES ($1)', [name])
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
