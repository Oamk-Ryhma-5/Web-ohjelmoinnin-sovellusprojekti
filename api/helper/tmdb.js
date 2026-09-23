import { ApiError } from './ApiError.js'

// TMDB-tunnus on vain palvelimella. Sitä ei lähetetä selaimeen.
export async function getFromTmdb(path, parameters = {}) {
  const token = (process.env.TMDB_READ_ACCESS_TOKEN || '').trim().replace(/^Bearer\s+/i, '')
  if (!token) {
    throw new ApiError(
      'Lisää TMDB_READ_ACCESS_TOKEN projektin .env-tiedostoon.',
      503,
      'TMDB_NOT_CONFIGURED',
    )
  }
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  url.searchParams.set('language', 'fi-FI')
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== '' && value !== undefined) url.searchParams.set(key, value)
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (response.status === 401 || response.status === 403) {
      throw new ApiError('TMDB-tunnus ei kelpaa.', 502, 'TMDB_AUTH_FAILED')
    }
    if (response.status === 429) {
      throw new ApiError('TMDB on varattu. Yritä hetken kuluttua.', 503, 'TMDB_BUSY')
    }
    if (!response.ok) {
      throw new ApiError('Elokuvatietojen haku epäonnistui.', 502, 'TMDB_ERROR')
    }
    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new ApiError('Haku kesti liian kauan.', 504, 'TMDB_TIMEOUT')
    }
    throw new ApiError('TMDB-palveluun ei saatu yhteyttä.', 502, 'TMDB_UNAVAILABLE')
  }
}
