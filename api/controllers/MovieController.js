import { selectGenres, selectMovies, selectNowPlaying } from '../models/Movie.js'
import { ApiError } from '../helper/ApiError.js'

function text(value, maxLength = 200) {
  if (value === undefined) return ''
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new ApiError('Tarkista hakuehdot.', 400, 'INVALID_QUERY')
  }
  return value.trim()
}

function readFilters(query) {
  const type = text(query.type, 10) || 'movie'
  const language = text(query.language, 5) || 'fi-FI'
  const page = text(query.page, 3) || '1'
  const year = text(query.year, 4)
  const genre = text(query.genre, 7)
  if (!['movie', 'tv'].includes(type)) {
    throw new ApiError('Valitse elokuvat tai sarjat.', 400, 'INVALID_TYPE')
  }
  if (!['fi-FI', 'en-US'].includes(language)) {
    throw new ApiError('Valitse suomi tai englanti.', 400, 'INVALID_LANGUAGE')
  }
  if (!/^\d+$/.test(page) || Number(page) < 1 || Number(page) > 500) {
    throw new ApiError('Virheellinen sivunumero.', 400, 'INVALID_PAGE')
  }
  if (
    year &&
    (!/^\d{4}$/.test(year) || Number(year) < 1800 || Number(year) > new Date().getFullYear() + 5)
  ) {
    throw new ApiError('Tarkista julkaisuvuosi.', 400, 'INVALID_YEAR')
  }
  if (genre && !/^[1-9]\d*$/.test(genre)) {
    throw new ApiError('Valitse genre listalta.', 400, 'INVALID_GENRE')
  }
  return { type, language, page: Number(page), year, genre, query: text(query.query) }
}

export async function getNowPlaying(req, res, next) {
  try {
    const { page, language } = readFilters(req.query)
    res.json(await selectNowPlaying(page, language))
  } catch (error) {
    next(error)
  }
}

export async function getGenres(req, res, next) {
  try {
    const { type, language } = readFilters(req.query)
    res.json({ genres: await selectGenres(type, language) })
  } catch (error) {
    next(error)
  }
}

export async function searchMovies(req, res, next) {
  try {
    const filters = readFilters(req.query)
    if (!filters.query && !filters.year && !filters.genre) {
      throw new ApiError('Anna vähintään yksi hakuehto.', 400, 'EMPTY_SEARCH')
    }
    res.json(await selectMovies(filters))
  } catch (error) {
    next(error)
  }
}
