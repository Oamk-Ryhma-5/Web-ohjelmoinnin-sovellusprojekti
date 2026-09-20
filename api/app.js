import express from 'express'
import cors from 'cors'
import errorHandler from './middleware/errorHandler.js'
import testRouter from './routes/testRouter.js'
import { createCatalogRouter } from './routes/catalogRouter.js'
import { createCatalogService } from './services/catalogService.js'
import { createTmdbClient } from './services/tmdbClient.js'
import { createAuthRepository } from './models/authRepository.js'
import { createAuthRouter } from './routes/authRouter.js'
import { pool } from './models/db.js'

export function createApp({ catalog = createCatalogService(createTmdbClient()), auth = createAuthRepository(pool), authOptions = {} } = {}) {
  const app = express()
  const port = process.env.FRONTEND_EXPOSED_PORT || '5173'
  const origins = process.env.APP_ORIGIN ? process.env.APP_ORIGIN.split(',').map(value => value.trim())
    : [`http://localhost:${port}`, `http://127.0.0.1:${port}`]
  app.disable('x-powered-by')
  app.use(cors({ origin: origins, credentials: true, allowedHeaders: ['Content-Type', 'X-Leffahaku-Request'] }))
  app.use(express.json({ limit: '16kb' }))
  app.use('/api/auth', createAuthRouter(auth, { origins, ...authOptions }))
  // Alkuperäisen pohjan tietokantaesimerkki ja terveystarkistus säilyvät.
  app.use('/', testRouter)
  app.use('/api', createCatalogRouter(catalog))
  app.get('/api/health', async (_req, res) => {
    try {
      const { pool } = await import('./models/db.js')
      await pool.query('SELECT 1')
      res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() })
    } catch {
      res.status(503).json({ status: 'unhealthy', database: 'disconnected', timestamp: new Date().toISOString() })
    }
  })
  app.use((_req, res) => res.status(404).json({ error: { message: 'Rajapinnan osoitetta ei löytynyt.', status: 404 } }))
  app.use(errorHandler)
  return app
}
