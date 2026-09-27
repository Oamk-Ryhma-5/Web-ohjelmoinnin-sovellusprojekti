import { ApiError } from '../helper/ApiError.js'

export function allowedOrigins() {
  if (process.env.APP_ORIGIN) {
    return process.env.APP_ORIGIN.split(',').map((value) => value.trim())
  }
  const port = process.env.FRONTEND_EXPOSED_PORT || '5173'
  return [`http://localhost:${port}`, `http://127.0.0.1:${port}`]
}

// Istuntoevästeen lisäksi muuttavan pyynnön pitää tulla oman sovelluksen kautta.
export function checkRequest(req, res, next) {
  res.set('Cache-Control', 'no-store')
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

  const origin = req.get('Origin')
  const ownRequest = req.get('X-Leffahaku-Request') === '1'
  if (
    !ownRequest ||
    !req.is('application/json') ||
    (origin && !allowedOrigins().includes(origin))
  ) {
    return next(new ApiError('Pyyntöä ei sallittu.', 403, 'REQUEST_REJECTED'))
  }
  next()
}
