<<<<<<< HEAD
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.status || 500
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(statusCode).json({ error: { message: 'Virheellinen pyyntö.', status: statusCode, code: 'INVALID_REQUEST' } })
  }
  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Palvelimella tapahtui virhe. Yritä uudelleen.' : err.message,
      status: statusCode,
      code: statusCode === 500 ? 'SERVER_ERROR' : err.code || 'SERVER_ERROR'
    }
  })
}

export default errorHandler
=======
import { ApiError } from '../helper/ApiError.js'

export default function errorHandler(error, _req, res, _next) {
  if (error.code === '23505') {
    return res.status(409).json({
      error: { code: 'ACCOUNT_EXISTS', message: 'Käyttäjänimi tai sähköposti on jo käytössä.' },
    })
  }
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } })
  }
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res
      .status(400)
      .json({ error: { code: 'INVALID_REQUEST', message: 'Virheellinen pyyntö.' } })
  }
  console.error('Palvelinvirhe:', error.code || error.name)
  res
    .status(500)
    .json({ error: { code: 'SERVER_ERROR', message: 'Palvelimen toiminnassa on virhe.' } })
}
>>>>>>> origin/yhdistetty-versio
