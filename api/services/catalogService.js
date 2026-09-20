import { ApiError } from './tmdbClient.js'

const MAX_PAGE = 500
const GENRE_CACHE_MS = 60 * 60 * 1000

function stringParameter(value, label, maxLength = 200) {
  if (value === undefined) return ''
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new ApiError(400, `${label} ei ole kelvollinen.`, 'INVALID_QUERY')
  }
  return value.trim()
}

function parsePage(value) {
  const page = stringParameter(value, 'Sivunumero', 3) || '1'
  if (!/^\d+$/.test(page) || Number(page) < 1 || Number(page) > MAX_PAGE) {
    throw new ApiError(400, 'Sivunumeron tulee olla välillä 1–500.', 'INVALID_PAGE')
  }
  return Number(page)
}

function parseType(value) {
  const type = stringParameter(value, 'Sisältötyyppi', 10) || 'movie'
  if (!['movie', 'tv'].includes(type)) throw new ApiError(400, 'Valitse elokuvat tai sarjat.', 'INVALID_TYPE')
  return type
}

function parseLanguage(value) {
  const language = stringParameter(value, 'Kieli', 5) || 'fi-FI'
  if (!['fi-FI', 'en-US'].includes(language)) throw new ApiError(400, 'Valitse suomi tai englanti.', 'INVALID_LANGUAGE')
  return language
}

function validateResults(data) {
  if (!data || !Array.isArray(data.results) || !Number.isInteger(data.total_pages) || data.total_pages < 0) {
    throw new ApiError(502, 'Elokuvatietojen palvelu palautti virheellisen vastauksen.', 'INVALID_TMDB_RESPONSE')
  }
  return data
}

function normalise(item, type, language) {
  const date = (type === 'movie' ? item.release_date : item.first_air_date) || ''
  const title = (type === 'movie' ? item.title : item.name) || (language === 'en-US' ? 'Title unavailable' : 'Nimi ei saatavilla')
  const posterPath = typeof item.poster_path === 'string' && /^\/[a-zA-Z0-9_.-]+$/.test(item.poster_path)
    ? item.poster_path : null
  const backdropPath = typeof item.backdrop_path === 'string' && /^\/[a-zA-Z0-9_.-]+$/.test(item.backdrop_path)
    ? item.backdrop_path : null
  return {
    id: item.id, type, title,
    originalTitle: (type === 'movie' ? item.original_title : item.original_name) || title,
    year: /^\d{4}-/.test(date) ? date.slice(0, 4) : '',
    releaseDate: date,
    overview: typeof item.overview === 'string' ? item.overview : '',
    posterUrl: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null,
    backdropUrl: backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : null,
    rating: typeof item.vote_average === 'number' && item.vote_count > 0 ? Math.round(item.vote_average * 10) / 10 : null,
    genreIds: Array.isArray(item.genre_ids) ? item.genre_ids : [],
    tmdbUrl: `https://www.themoviedb.org/${type}/${item.id}`,
  }
}

function validItem(item) {
  return item && Number.isInteger(item.id) && item.id > 0 && item.adult !== true
}

function pagination(data, nextPage) {
  return {
    nextPage: nextPage <= Math.min(data.total_pages, MAX_PAGE) ? nextPage : null,
    limitReached: nextPage > MAX_PAGE && data.total_pages > MAX_PAGE,
  }
}

export function createCatalogService(tmdb) {
  const genreCache = new Map()
  async function genres(rawType, rawLanguage) {
    const type = parseType(rawType)
    const language = parseLanguage(rawLanguage)
    const cacheKey = `${type}:${language}`
    const cached = genreCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.genres
    const data = await tmdb.get(`/genre/${type}/list`, { language })
    if (!Array.isArray(data?.genres) || data.genres.some(g => !Number.isInteger(g.id) || typeof g.name !== 'string')) {
      throw new ApiError(502, 'Genrelistaa ei saatu ladattua.', 'INVALID_TMDB_RESPONSE')
    }
    const list = [...data.genres].sort((a, b) => a.name.localeCompare(b.name, language))
    genreCache.set(cacheKey, { expiresAt: Date.now() + GENRE_CACHE_MS, genres: list })
    return list
  }

  return {
    genres,
    async nowPlaying(rawPage, rawLanguage) {
      const page = parsePage(rawPage)
      const language = parseLanguage(rawLanguage)
      // FI rajaa esitykset Suomeen. Se ei rajaa elokuvien tuotantomaata.
      const data = validateResults(await tmdb.get('/movie/now_playing', { region: 'FI', page, language }))
      return {
        results: data.results.filter(validItem).map(item => normalise(item, 'movie', language)),
        ...pagination(data, page + 1),
        region: 'FI',
      }
    },

    async search(raw) {
      const type = parseType(raw.type)
      const language = parseLanguage(raw.language)
      const query = stringParameter(raw.query, 'Nimi')
      const year = stringParameter(raw.year, 'Vuosi', 4)
      const genre = stringParameter(raw.genre, 'Genre', 7)
      const page = parsePage(raw.page)
      if (year && (!/^\d{4}$/.test(year) || Number(year) < 1800 || Number(year) > new Date().getFullYear() + 5)) {
        throw new ApiError(400, `Anna vuosi väliltä 1800–${new Date().getFullYear() + 5}.`, 'INVALID_YEAR')
      }
      if (genre && !/^[1-9]\d*$/.test(genre)) throw new ApiError(400, 'Valitse genre listalta.', 'INVALID_GENRE')
      if (!query && !year && !genre) {
        throw new ApiError(400, 'Kirjoita nimi tai valitse vuosi tai genre.', 'EMPTY_SEARCH')
      }
      if (genre && !(await genres(type, language)).some(g => g.id === Number(genre))) {
        throw new ApiError(400, 'Valittu genre ei kuulu tähän sisältötyyppiin.', 'INVALID_GENRE')
      }

      const parameters = { include_adult: false, language }
      if (year) parameters[type === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = year
      if (query) parameters.query = query
      else {
        parameters.sort_by = 'popularity.desc'
        if (genre) parameters.with_genres = genre
      }
      // TMDB:n nimihaku ei tue with_genres-parametria. Suodatamme sen
      // palvelimella ja jatkamme sivutusta myös tyhjien tulossivujen yli.
      const filterGenre = Boolean(query && genre)
      const maxPagesPerRequest = filterGenre ? 5 : 1
      const path = `/${query ? 'search' : 'discover'}/${type}`
      const results = []
      let sourcePage = page
      let data
      let scannedPages = 0
      do {
        data = validateResults(await tmdb.get(path, { ...parameters, page: sourcePage }))
        for (const item of data.results.filter(validItem)) {
          if (!filterGenre || item.genre_ids?.includes(Number(genre))) results.push(normalise(item, type, language))
        }
        sourcePage += 1
        scannedPages += 1
      } while (filterGenre && results.length < 20 && scannedPages < maxPagesPerRequest &&
               sourcePage <= Math.min(data.total_pages, MAX_PAGE))
      return { results, ...pagination(data, sourcePage), scannedPages }
    },
  }
}
