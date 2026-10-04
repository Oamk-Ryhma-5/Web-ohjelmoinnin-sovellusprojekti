import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import testRouter from './routes/testRouter.js'
import movieRouter from './routes/movieRouter.js'
import userRouter from './routes/userRouter.js'
import favoriteRouter from './routes/favoriteRouter.js' // 1. Tuodaan uusi reititin
import groupRouter from './routes/groupRouter.js' // Tuodaan ryhmäreititin
import reviewRouter from './routes/reviewRouter.js'
import errorHandler from './middleware/errorHandler.js'
import { allowedOrigins } from './middleware/checkRequest.js'
import { pool } from './models/db.js'
import { ApiError } from './helper/ApiError.js'

const app = express()
app.disable('x-powered-by')
app.use(cors({ origin: allowedOrigins(), credentials: true }))
app.use(express.json({ limit: '16kb' }))

// Reitit
app.use('/', testRouter)
app.use('/api', movieRouter)
app.use('/api/auth', userRouter)
app.use('/api/favorites', favoriteRouter) // 2. Kytketään osoitteeseen /api/favorites
app.use('/api/groups', groupRouter) // Kytketään ryhmäreititin osoitteeseen /api/groups
app.use('/api/reviews', reviewRouter)

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