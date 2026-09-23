import { getFromTmdb } from '../helper/tmdb.js'
import { ApiError } from '../helper/ApiError.js'

const maxPage = 500

function imageUrl(path, size) {
  if (typeof path !== 'string' || !/^\/[a-zA-Z0-9_.-]+$/.test(path)) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

function movieInfo(item, type) {
  let title = item.title
  let date = item.release_date
  if (type === 'tv') {
    title = item.name
    date = item.first_air_date
  }
  return {
    id: item.id,
    type,
    title: title || '',
    year: date ? date.slice(0, 4) : '',
    overview: item.overview || '',
    posterUrl: imageUrl(item.poster_path, 'w500'),
    backdropUrl: imageUrl(item.backdrop_path, 'w1280'),
    genreIds: item.genre_ids || [],
    rating: item.vote_count > 0 && typeof item.vote_average === 'number' ? item.vote_average : null,
    tmdbUrl: `https://www.themoviedb.org/${type}/${item.id}`,
  }
}

function checkResults(data) {
  if (
    !Array.isArray(data?.results) ||
    !Number.isInteger(data.total_pages) ||
    data.total_pages < 0
  ) {
    throw new ApiError('TMDB palautti virheellisen vastauksen.', 502, 'INVALID_TMDB_RESPONSE')
  }
}

function validMovie(item) {
  return item && Number.isInteger(item.id) && item.id > 0 && item.adult !== true
}

function nextPage(data, page) {
  if (page > Math.min(data.total_pages, maxPage)) return null
  return page
}

export async function selectGenres(type, language) {
  const data = await getFromTmdb(`/genre/${type}/list`, { language })
  if (
    !Array.isArray(data?.genres) ||
    data.genres.some((genre) => !Number.isInteger(genre.id) || typeof genre.name !== 'string')
  ) {
    throw new ApiError('Genrejä ei saatu ladattua.', 502, 'INVALID_TMDB_RESPONSE')
  }
  return data.genres.sort((a, b) => a.name.localeCompare(b.name, language))
}

export async function selectNowPlaying(page, language) {
  // FI tarkoittaa Suomen teatteriohjelmistoa, ei elokuvan tuotantomaata.
  const data = await getFromTmdb('/movie/now_playing', { region: 'FI', page, language })
  checkResults(data)
  return {
    results: data.results.filter(validMovie).map((item) => movieInfo(item, 'movie')),
    nextPage: nextPage(data, page + 1),
  }
}

export async function selectMovies(filters) {
  const { type, language, query, year, genre } = filters
  const parameters = { include_adult: false, language }
  if (year) {
    const yearField = type === 'movie' ? 'primary_release_year' : 'first_air_date_year'
    parameters[yearField] = year
  }
  if (genre) {
    const genres = await selectGenres(type, language)
    if (!genres.some((item) => item.id === Number(genre))) {
      throw new ApiError('Valitse genre listalta.', 400, 'INVALID_GENRE')
    }
  }
  if (query) {
    parameters.query = query
  } else {
    parameters.sort_by = 'popularity.desc'
    if (genre) parameters.with_genres = genre
  }

  const path = `/${query ? 'search' : 'discover'}/${type}`
  const filterGenre = Boolean(query && genre)
  const results = []
  let page = filters.page
  let scannedPages = 0
  let data

  // TMDB:n nimihaku ei suodata genreä. Tehdään se täällä ja luetaan tarvittaessa lisää sivuja.
  do {
    data = await getFromTmdb(path, { ...parameters, page })
    checkResults(data)
    for (const item of data.results.filter(validMovie)) {
      if (!filterGenre || item.genre_ids?.includes(Number(genre))) {
        results.push(movieInfo(item, type))
      }
    }
    page += 1
    scannedPages += 1
  } while (
    filterGenre &&
    results.length < 20 &&
    scannedPages < 5 &&
    page <= Math.min(data.total_pages, maxPage)
  )

  return { results, nextPage: nextPage(data, page) }
}
