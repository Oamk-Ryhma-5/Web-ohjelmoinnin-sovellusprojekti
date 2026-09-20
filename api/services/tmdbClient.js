export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Käyttöavain luetaan vain palvelimella. Sitä ei palauteta selaimelle.
export function createTmdbClient({
  token = process.env.TMDB_READ_ACCESS_TOKEN || '',
  fetchImpl = globalThis.fetch,
  timeoutMs = 8000,
} = {}) {
  const accessToken = token.trim().replace(/^Bearer\s+/i, '')
  return {
    async get(path, parameters = {}) {
      if (!accessToken) {
        throw new ApiError(503,
          'TMDB-käyttöavain puuttuu. Lisää TMDB_READ_ACCESS_TOKEN projektin .env-tiedostoon.',
          'TMDB_NOT_CONFIGURED')
      }
      const url = new URL(`https://api.themoviedb.org/3${path}`)
      url.searchParams.set('language', 'fi-FI')
      for (const [key, value] of Object.entries(parameters)) {
        if (value !== '' && value !== undefined && value !== null) url.searchParams.set(key, String(value))
      }
      try {
        const response = await fetchImpl(url, {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        })
        if (response.status === 401 || response.status === 403) {
          throw new ApiError(502, 'TMDB-käyttöavain ei kelpaa. Tarkista palvelimen asetukset.', 'TMDB_AUTH_FAILED')
        }
        if (response.status === 429) {
          throw new ApiError(503, 'Elokuvatietoja haetaan juuri nyt paljon. Yritä hetken kuluttua uudelleen.', 'TMDB_BUSY')
        }
        if (!response.ok) throw new ApiError(502, 'Elokuvatietojen haku epäonnistui. Yritä uudelleen.', 'TMDB_ERROR')
        return await response.json()
      } catch (error) {
        if (error instanceof ApiError) throw error
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          throw new ApiError(504, 'Elokuvatietojen haku kesti liian kauan. Yritä uudelleen.', 'TMDB_TIMEOUT')
        }
        throw new ApiError(502, 'Elokuvatietojen palveluun ei saatu yhteyttä. Yritä uudelleen.', 'TMDB_UNAVAILABLE')
      }
    },
  }
}
