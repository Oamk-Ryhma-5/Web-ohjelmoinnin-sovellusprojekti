import app from './app.js'
import { pool } from './models/db.js'
import { migrate } from './models/migrate.js'

const port = process.env.PORT || 3000

try {
  await migrate(pool)
  app.listen(port, '0.0.0.0', () => {
    console.log(`Backend käynnissä portissa ${port}`)
  })
} catch (error) {
  console.error('Tietokannan alustus epäonnistui:', error.code || error.name)
  await pool.end()
  process.exitCode = 1
}
