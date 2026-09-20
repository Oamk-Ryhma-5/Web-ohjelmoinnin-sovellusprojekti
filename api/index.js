import 'dotenv/config'
import { createApp } from './app.js'
import { pool } from './models/db.js'
import { migrate } from './models/migrate.js'

const port = process.env.PORT || 3000

try {
  await migrate(pool)
  createApp().listen(port, '0.0.0.0', () => {
    console.log(`Backend käynnissä portissa ${port}`)
  })
} catch (error) {
  console.error('Tietokannan päivitys epäonnistui. Tarkista tietokantayhteys.', error.code || '')
  await pool.end()
  process.exitCode = 1
}
