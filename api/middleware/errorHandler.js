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
