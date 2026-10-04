import { ApiError } from '../helper/ApiError.js'

export function allowedOrigins() {
  if (process.env.APP_ORIGIN) {
    return process.env.APP_ORIGIN.split(',').map((value) => value.trim())
  }
  const port = process.env.FRONTEND_EXPOSED_PORT || '5173'
  return [
    `http://localhost:${port}`, 
    `http://127.0.0.1:${port}`,
    `http://localhost`, 
    `http://127.0.0.1`,
    'http://86.50.21.8',
    'http://86.50.21.8:80',
    'http://86.50.21.8:5173'
  ]
}

export function checkRequest(req, res, next) {
  res.set('Cache-Control', 'no-store')
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

  const origin = req.get('Origin')
  const ownRequest = req.get('X-Leffahaku-Request') === '1'

  // Sallitaan pyyntö jos Origin löytyy sallituista tai pyyntö tulee ilman origin-otsaketta samasta domenista
  if (origin && !allowedOrigins().includes(origin) && !allowedOrigins().includes(origin.replace(/:80$/, ''))) {
    return next(new ApiError('Pyyntöä ei sallittu (Origin).', 403, 'REQUEST_REJECTED'))
  }

  // 2. Vaaditaan application/json pyynnöiltä, joissa on runko (POST, PUT, PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return next(new ApiError('Pyyntöä ei sallittu (JSON puuttuu).', 403, 'REQUEST_REJECTED'))
  }

  next()
}