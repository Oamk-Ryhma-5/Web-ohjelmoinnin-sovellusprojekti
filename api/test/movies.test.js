import test, { before, after, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import app from '../app.js'
import { pool } from '../models/db.js'

const realFetch = globalThis.fetch
let server
let address
let calls
let tmdbResponse
const movie = {
  id: 1,
  title: 'Testielokuva',
  name: 'Testisarja',
  release_date: '2024-04-01',
  first_air_date: '2022-01-01',
  genre_ids: [28],
  overview: 'Testikuvaus',
  poster_path: '/poster.jpg',
  vote_count: 5,
  vote_average: 7.4,
}

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  address = `http://127.0.0.1:${server.address().port}`
  mock.method(globalThis, 'fetch', async (url, options) => {
    if (String(url).startsWith('https://api.themoviedb.org/3/')) {
      const parsed = new URL(url)
      calls.push({ path: parsed.pathname, params: parsed.searchParams, headers: options.headers })
      return tmdbResponse(parsed)
    }
    return realFetch(url, options)
  })
})

after(async () => {
  server?.closeAllConnections()
  if (server) await new Promise((resolve) => server.close(resolve))
  mock.restoreAll()
  await pool.end()
})

beforeEach(() => {
  calls = []
  process.env.TMDB_READ_ACCESS_TOKEN = 'test-token'
  tmdbResponse = (url) => {
    if (url.pathname.includes('/genre/'))
      return Response.json({ genres: [{ id: 28, name: 'Action' }] })
    return Response.json({ results: [movie], total_pages: 2 })
  }
})

async function request(path) {
  const response = await realFetch(`${address}/api${path}`)
  return { status: response.status, body: await response.json() }
}

test('teatterilista käyttää Suomen aluetta ja palauttaa vain sopivat elokuvat', async () => {
  tmdbResponse = () =>
    Response.json({
      results: [movie, { ...movie, id: 2, adult: true }, { title: 'Invalid' }],
      total_pages: 2,
    })
  const result = await request('/movies/now-playing')
  assert.equal(result.status, 200)
  assert.equal(calls[0].path, '/3/movie/now_playing')
  assert.equal(calls[0].params.get('region'), 'FI')
  assert.equal(calls[0].params.get('language'), 'fi-FI')
  assert.equal(result.body.results.length, 1)
  assert.equal(result.body.results[0].year, '2024')
  assert.equal(result.body.nextPage, 2)
  assert.equal(JSON.stringify(result.body).includes('test-token'), false)
})

test('englanninkielinen teatterilista pysyy Suomen alueella', async () => {
  await request('/movies/now-playing?language=en-US')
  assert.equal(calls[0].params.get('language'), 'en-US')
  assert.equal(calls[0].params.get('region'), 'FI')
})

test('nimi ja vuosi välitetään elokuvien hakureitille', async () => {
  const result = await request('/search?query=Batman&year=2024')
  assert.equal(result.status, 200)
  assert.equal(calls[0].path, '/3/search/movie')
  assert.equal(calls[0].params.get('query'), 'Batman')
  assert.equal(calls[0].params.get('primary_release_year'), '2024')
  assert.equal(calls[0].params.get('include_adult'), 'false')
})

test('vuosi ja genre ilman nimeä käyttävät discover-hakua', async () => {
  const result = await request('/search?year=2024&genre=28')
  assert.equal(result.status, 200)
  assert.equal(calls[1].path, '/3/discover/movie')
  assert.equal(calls[1].params.get('with_genres'), '28')
  assert.equal(calls[1].params.get('primary_release_year'), '2024')
})

test('sarjahaku käyttää sarjan nimeä ja ensimmäistä esitysvuotta', async () => {
  const result = await request('/search?type=tv&query=Test&year=2022&genre=28&language=en-US')
  assert.equal(result.status, 200)
  assert.equal(calls[0].path, '/3/genre/tv/list')
  assert.equal(calls[1].path, '/3/search/tv')
  assert.equal(calls[1].params.get('first_air_date_year'), '2022')
  assert.equal(calls[1].params.get('primary_release_year'), null)
  assert.equal(result.body.results[0].title, 'Testisarja')
  assert.equal(result.body.results[0].year, '2022')
})

test('nimi ja genre yhdistyvät myös tyhjien lähdesivujen yli ilman tulosten hukkaamista', async () => {
  tmdbResponse = (url) => {
    if (url.pathname.includes('/genre/'))
      return Response.json({ genres: [{ id: 28, name: 'Action' }] })
    const page = Number(url.searchParams.get('page'))
    const genre = page === 3 ? 28 : 35
    return Response.json({ results: [{ ...movie, id: page, genre_ids: [genre] }], total_pages: 8 })
  }
  const result = await request('/search?query=Test&genre=28')
  assert.equal(result.status, 200)
  assert.deepEqual(
    result.body.results.map((item) => item.id),
    [3],
  )
  assert.equal(calls.length, 6)
  assert.equal(result.body.nextPage, 6)
  assert.equal(calls[1].params.get('with_genres'), null)
})

test('sivutus ei pyydä TMDB:n 500 sivun rajan yli', async () => {
  tmdbResponse = () => Response.json({ results: [movie], total_pages: 900 })
  const result = await request('/movies/now-playing?page=500')
  assert.equal(result.body.nextPage, null)
  assert.equal((await request('/movies/now-playing?page=501')).status, 400)
})

test('tyhjä haku ja virheelliset parametrit estetään ennen TMDB-pyyntöä', async () => {
  for (const path of [
    '/search',
    '/search?query=Test&year=abc',
    '/search?query=Test&year=1700',
    '/search?query=Test&genre=-2',
    '/search?query=Test&type=person',
    '/search?query=Test&language=sv-SE',
    '/search?query=Test&page=0',
    '/search?query=one&query=two',
    '/search?query=Test&page=1.5',
  ]) {
    assert.equal((await request(path)).status, 400, path)
  }
  assert.equal(calls.length, 0)
})

test('valitulle sisältötyypille tuntematon genre hylätään', async () => {
  const result = await request('/search?query=Test&genre=999')
  assert.equal(result.status, 400)
  assert.equal(result.body.error.code, 'INVALID_GENRE')
  assert.equal(calls.length, 1)
})

test('puuttuva TMDB-tunnus antaa selkeän virheen', async () => {
  delete process.env.TMDB_READ_ACCESS_TOKEN
  const result = await request('/movies/now-playing')
  assert.equal(result.status, 503)
  assert.equal(result.body.error.code, 'TMDB_NOT_CONFIGURED')
  assert.equal(calls.length, 0)
})

test('väärä TMDB-tunnus ja palvelun ruuhka palautetaan ymmärrettävinä virheinä', async () => {
  tmdbResponse = () => new Response('{}', { status: 401 })
  assert.equal((await request('/movies/now-playing')).body.error.code, 'TMDB_AUTH_FAILED')
  tmdbResponse = () => new Response('{}', { status: 429 })
  assert.equal((await request('/movies/now-playing')).body.error.code, 'TMDB_BUSY')
})

test('verkko- ja aikakatkaisuvirhe eivät paljasta teknisiä palvelintietoja', async () => {
  tmdbResponse = () => {
    throw new TypeError('private network address')
  }
  assert.equal((await request('/movies/now-playing')).body.error.code, 'TMDB_UNAVAILABLE')
  tmdbResponse = () => {
    throw new DOMException('timeout', 'TimeoutError')
  }
  assert.equal((await request('/movies/now-playing')).body.error.code, 'TMDB_TIMEOUT')
})

test('virheellinen TMDB-vastaus hylätään', async () => {
  tmdbResponse = () => Response.json({ results: 'broken', total_pages: 1 })
  assert.equal((await request('/movies/now-playing')).body.error.code, 'INVALID_TMDB_RESPONSE')
  tmdbResponse = () => Response.json({ genres: [{ id: 'wrong', name: 12 }] })
  assert.equal((await request('/genres')).body.error.code, 'INVALID_TMDB_RESPONSE')
})

test('puuttuville kuville tai kuvauksille ei keksitä sisältöä', async () => {
  tmdbResponse = () =>
    Response.json({
      results: [
        { ...movie, overview: '', poster_path: '//untrusted.example/image.jpg', vote_count: 0 },
      ],
      total_pages: 1,
    })
  const result = await request('/movies/now-playing')
  assert.equal(result.body.results[0].overview, '')
  assert.equal(result.body.results[0].posterUrl, null)
  assert.equal(result.body.results[0].rating, null)
  assert.equal(result.body.nextPage, null)
})
