import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import testRouter from './routes/testRouter.js'
import movieRouter from './routes/movieRouter.js'
import userRouter from './routes/userRouter.js'
import errorHandler from './middleware/errorHandler.js'
import { allowedOrigins } from './middleware/checkRequest.js'
import { pool } from './models/db.js'
import { ApiError } from './helper/ApiError.js'

const app = express()
app.disable('x-powered-by')
app.use(cors({ origin: allowedOrigins(), credentials: true }))
app.use(express.json({ limit: '16kb' }))

// Alkuperäisen Docker-pohjan esimerkkireitti ja terveystarkistus säilyvät.
app.use('/', testRouter)
app.use('/api', movieRouter)
app.use('/api/auth', userRouter)

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'healthy', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' })
  }
})

app.use((_req, _res, next) => {
  next(new ApiError('Osoitetta ei löytynyt.', 404, 'NOT_FOUND'))
})
app.use(errorHandler)

export default app
