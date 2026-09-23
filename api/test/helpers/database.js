import { PGlite } from '@electric-sql/pglite'

// Testeissä käytetään PostgreSQL:n WASM-versiota oikeilla SQL-lauseilla.
// Sarjoitus jäljittelee yhtä pg-poolin yhteyttä, myös transaktioiden aikana.
export async function createTestDatabase() {
  const db = await PGlite.create()
  let tail = Promise.resolve()
  async function acquire() {
    const previous = tail
    let release
    tail = new Promise((resolve) => {
      release = resolve
    })
    await previous
    return release
  }
  async function query(sql, params) {
    const result = params ? await db.query(sql, params) : (await db.exec(sql)).at(-1)
    return { ...result, rowCount: result.affectedRows || result.rows?.length || 0 }
  }
  return {
    async query(sql, params) {
      const release = await acquire()
      try {
        return await query(sql, params)
      } finally {
        release()
      }
    },
    async connect() {
      return { query, release: await acquire() }
    },
    async end() {
      await tail
      await db.close()
    },
  }
}
