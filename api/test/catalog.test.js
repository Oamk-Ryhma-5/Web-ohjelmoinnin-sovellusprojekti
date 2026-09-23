import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createApp } from '../app.js'
import { createTmdbClient } from '../services/tmdbClient.js'
import { createCatalogService } from '../services/catalogService.js'

const movie = { id: 101, title: 'Testielokuva', original_title: 'Test Movie', release_date: '2024-05-02', overview: 'Kuvaus', genre_ids: [28], poster_path: '/poster.jpg' }
const tv = { id: 202, name: 'Testisarja', first_air_date: '2021-03-01', genre_ids: [18], poster_path: null }
const page = (results, totalPages = 1) => ({ results, total_pages: totalPages, total_results: results.length })

async function serverFor(t, handler, overrides = {}) {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return handler(url, options)
  }
  const client = createTmdbClient({ token: 'private-test-token', fetchImpl, ...overrides })
  const app = createApp({ catalog: createCatalogService(client) })
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  return {
    calls,
    async get(path) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`)
      return { status: response.status, body: await response.json() }
    },
  }
}

function withGenres(handler) {
  return (url, options) => {
    if (url.pathname.startsWith('/3/genre/')) {
      return Response.json({ genres: url.pathname.includes('/movie/')
        ? [{ id: 28, name: 'Toiminta' }, { id: 18, name: 'Draama' }]
        : [{ id: 18, name: 'Draama' }, { id: 10765, name: 'Sci-Fi & Fantasy' }] })
    }
    return handler(url, options)
  }
}

test('Suomen teatterilistaus käyttää FI-aluetta ja suomenkielisiä tietoja', async t => {
  const server = await serverFor(t, (url, options) => {
    assert.equal(url.pathname, '/3/movie/now_playing')
    assert.equal(url.searchParams.get('region'), 'FI')
    assert.equal(url.searchParams.get('language'), 'fi-FI')
    assert.equal(url.searchParams.has('with_original_language'), false)
    assert.equal(options.headers.Authorization, 'Bearer private-test-token')
    return Response.json(page([movie], 2))
  })
  const { status, body } = await server.get('/api/movies/now-playing')
  assert.equal(status, 200)
  assert.equal(body.region, 'FI')
  assert.equal(body.results[0].title, movie.title)
  assert.equal(body.results[0].posterUrl, 'https://image.tmdb.org/t/p/w500/poster.jpg')
  assert.equal(body.nextPage, 2)
  assert.equal(JSON.stringify(body).includes('private-test-token'), false)
})

test('teatterilistan seuraava sivu välitetään oikein ja viimeinen sivu lopettaa haun', async t => {
  const server = await serverFor(t, url => {
    assert.equal(url.searchParams.get('page'), '2')
    return Response.json(page([movie], 2))
  })
  assert.equal((await server.get('/api/movies/now-playing?page=2')).body.nextPage, null)
})

test('tyhjä tulos on onnistunut vastaus ilman seuraavaa sivua', async t => {
  const server = await serverFor(t, () => Response.json(page([], 0)))
  assert.deepEqual((await server.get('/api/movies/now-playing')).body.results, [])
  assert.equal((await server.get('/api/movies/now-playing')).body.nextPage, null)
})

test('elokuvan nimihaku ja vuosi välittyvät yhdessä ja erikoismerkit säilyvät', async t => {
  const server = await serverFor(t, url => {
    assert.equal(url.pathname, '/3/search/movie')
    assert.equal(url.searchParams.get('query'), 'Ääni & yö?')
    assert.equal(url.searchParams.get('primary_release_year'), '2024')
    assert.equal(url.searchParams.get('include_adult'), 'false')
    return Response.json(page([movie]))
  })
  assert.equal((await server.get('/api/search?type=movie&query=%C3%84%C3%A4ni%20%26%20y%C3%B6%3F&year=2024')).status, 200)
})

test('sarjan nimihaku käyttää ensiesitysvuotta ja sarjan nimeä', async t => {
  const server = await serverFor(t, url => {
    assert.equal(url.pathname, '/3/search/tv')
    assert.equal(url.searchParams.get('first_air_date_year'), '2021')
    assert.equal(url.searchParams.has('year'), false)
    return Response.json(page([tv]))
  })
  const { body } = await server.get('/api/search?type=tv&query=Testisarja&year=2021')
  assert.equal(body.results[0].title, 'Testisarja')
  assert.equal(body.results[0].year, '2021')
  assert.equal(body.results[0].posterUrl, null)
})

for (const type of ['movie', 'tv']) {
  test(`${type}: pelkkä vuosihaku käyttää discover-hakua`, async t => {
    const server = await serverFor(t, url => {
      assert.equal(url.pathname, `/3/discover/${type}`)
      assert.equal(url.searchParams.get(type === 'movie' ? 'primary_release_year' : 'first_air_date_year'), '2024')
      assert.equal(url.searchParams.has('query'), false)
      return Response.json(page([]))
    })
    assert.equal((await server.get(`/api/search?type=${type}&year=2024`)).status, 200)
  })

  test(`${type}: genrehaku toimii ilman nimeä`, async t => {
    const genre = type === 'movie' ? '28' : '10765'
    const server = await serverFor(t, withGenres(url => {
      assert.equal(url.pathname, `/3/discover/${type}`)
      assert.equal(url.searchParams.get('with_genres'), genre)
      return Response.json(page([]))
    }))
    assert.equal((await server.get(`/api/search?type=${type}&genre=${genre}`)).status, 200)
  })

  test(`${type}: nimi, vuosi ja genre yhdistyvät myös myöhemmillä sivuilla`, async t => {
    const server = await serverFor(t, withGenres(url => {
      assert.equal(url.pathname, `/3/search/${type}`)
      assert.equal(url.searchParams.get('query'), 'Testi')
      assert.equal(url.searchParams.get(type === 'movie' ? 'primary_release_year' : 'first_air_date_year'), '2024')
      assert.equal(url.searchParams.has('with_genres'), false)
      const result = type === 'movie' ? movie : tv
      return Response.json(page([{ ...result, genre_ids: Number(url.searchParams.get('page')) === 1 ? [999] : [18] }], 2))
    }))
    const { body, status } = await server.get(`/api/search?type=${type}&query=Testi&year=2024&genre=18`)
    assert.equal(status, 200)
    assert.equal(body.results.length, 1)
    assert.equal(body.scannedPages, 2)
    assert.equal(body.nextPage, null)
  })
}

test('vuosi ja genre toimivat yhdessä ilman nimeä', async t => {
  const server = await serverFor(t, withGenres(url => {
    assert.equal(url.pathname, '/3/discover/movie')
    assert.equal(url.searchParams.get('primary_release_year'), '2024')
    assert.equal(url.searchParams.get('with_genres'), '18')
    return Response.json(page([]))
  }))
  assert.equal((await server.get('/api/search?year=2024&genre=18')).status, 200)
})

test('harvan yhdistelmähaun jatkosivu säilyy, vaikka viideltä sivulta ei löydy osumaa', async t => {
  const server = await serverFor(t, withGenres(url => Response.json(page([
    { ...movie, genre_ids: url.searchParams.get('page') === '7' ? [28] : [18] },
  ], 7))))
  const first = await server.get('/api/search?query=Testi&genre=28')
  assert.deepEqual(first.body.results, [])
  assert.equal(first.body.nextPage, 6)
  assert.equal(first.body.scannedPages, 5)
  const second = await server.get('/api/search?query=Testi&genre=28&page=6')
  assert.equal(second.body.results.length, 1)
  assert.equal(second.body.nextPage, null)
})

test('elokuvien ja sarjojen genrelistat pidetään erillään ja välimuistissa', async t => {
  const server = await serverFor(t, withGenres(() => Response.json(page([]))))
  const a = await server.get('/api/genres?type=movie')
  const b = await server.get('/api/genres?type=tv')
  await server.get('/api/genres?type=movie')
  assert.ok(a.body.genres.some(g => g.id === 28))
  assert.ok(!b.body.genres.some(g => g.id === 28))
  assert.equal(server.calls.length, 2)
})

test('väärän sisältötyypin genre hylätään', async t => {
  const server = await serverFor(t, withGenres(() => Response.json(page([]))))
  assert.equal((await server.get('/api/search?type=tv&genre=28')).status, 400)
})

for (const path of [
  '/api/search', '/api/search?query=%20%20', '/api/search?type=person&query=a',
  '/api/search?year=abcd', '/api/search?year=0', '/api/search?genre=-1',
  '/api/search?query=a&query=b', '/api/search?query=a&page=501',
  '/api/movies/now-playing?page=0', '/api/movies/now-playing?page=1.5',
]) {
  test(`virheellinen syöte hylätään ennen TMDB-kutsua: ${path}`, async t => {
    const server = await serverFor(t, () => { throw new Error('TMDB:hen ei saa kutsua') })
    assert.equal((await server.get(path)).status, 400)
    assert.equal(server.calls.length, 0)
  })
}

test('puuttuva käyttöavain antaa ohjeen ilman ulkoista kutsua', async t => {
  const server = await serverFor(t, () => { throw new Error('ei kutsua') }, { token: '' })
  const result = await server.get('/api/movies/now-playing')
  assert.equal(result.status, 503)
  assert.equal(result.body.error.code, 'TMDB_NOT_CONFIGURED')
  assert.equal(server.calls.length, 0)
})

for (const [upstreamStatus, expectedStatus, code] of [
  [401, 502, 'TMDB_AUTH_FAILED'], [403, 502, 'TMDB_AUTH_FAILED'],
  [429, 503, 'TMDB_BUSY'], [500, 502, 'TMDB_ERROR'],
]) {
  test(`TMDB-virhe ${upstreamStatus} palautetaan hallitusti`, async t => {
    const server = await serverFor(t, () => new Response('private-test-token', { status: upstreamStatus }))
    const result = await server.get('/api/movies/now-playing')
    assert.equal(result.status, expectedStatus)
    assert.equal(result.body.error.code, code)
    assert.equal(JSON.stringify(result.body).includes('private-test-token'), false)
  })
}

test('aikakatkaisu ei jätä pyyntöä odottamaan', async t => {
  const server = await serverFor(t, (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  }), { timeoutMs: 20 })
  assert.equal((await server.get('/api/movies/now-playing')).status, 504)
})

test('rikkoutunut TMDB-vastaus ei näy onnistuneena tyhjänä hakuna', async t => {
  const server = await serverFor(t, () => Response.json({ unexpected: true }))
  assert.equal((await server.get('/api/movies/now-playing')).status, 502)
})

test('puuttuva juliste ja julkaisupäivä käsitellään ilman rikkoutunutta kuvalinkkiä', async t => {
  const server = await serverFor(t, () => Response.json(page([{ ...movie, poster_path: null, release_date: '' }])))
  const { body } = await server.get('/api/movies/now-playing')
  assert.equal(body.results[0].posterUrl, null)
  assert.equal(body.results[0].year, '')
})
