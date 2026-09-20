import test from 'node:test'
import assert from 'node:assert/strict'
import { createCatalogService } from '../services/catalogService.js'

test('englanninkielinen teatterihaku säilyttää Suomen alueen ja hakee englanninkielisen kuvauksen', async () => {
  const catalog = createCatalogService({ get: async (path, params) => {
    assert.equal(path, '/movie/now_playing')
    assert.equal(params.region, 'FI')
    assert.equal(params.language, 'en-US')
    return { results: [{ id: 1, title: 'The Film', overview: 'English description.', backdrop_path: '/scene.jpg', vote_average: 7.53, vote_count: 100 }], total_pages: 1 }
  } })
  const data = await catalog.nowPlaying('1', 'en-US')
  assert.equal(data.results[0].overview, 'English description.')
  assert.equal(data.results[0].backdropUrl, 'https://image.tmdb.org/t/p/w1280/scene.jpg')
  assert.equal(data.results[0].rating, 7.5)
})

test('genrevälimuisti erottaa sekä kielet että sisältötyypit', async () => {
  const calls = []
  const catalog = createCatalogService({ get: async (path, params) => {
    calls.push({ path, ...params })
    return { genres: [{ id: 18, name: params.language === 'en-US' ? 'Drama' : 'Draama' }] }
  } })
  assert.equal((await catalog.genres('movie', 'fi-FI'))[0].name, 'Draama')
  assert.equal((await catalog.genres('movie', 'en-US'))[0].name, 'Drama')
  await catalog.genres('tv', 'en-US')
  await catalog.genres('movie', 'en-US')
  assert.equal(calls.length, 3)
})

for (const type of ['movie', 'tv']) test(`${type}: nimi, vuosi ja genre välittävät englannin myös jatkosivuille`, async () => {
  const catalog = createCatalogService({ get: async (path, params) => {
    assert.equal(params.language, 'en-US')
    if (path.startsWith('/genre/')) return { genres: [{ id: 18, name: 'Drama' }] }
    assert.equal(path, `/search/${type}`)
    assert.equal(params[type === 'movie' ? 'primary_release_year' : 'first_air_date_year'], '2024')
    return { results: [{ id: params.page, title: 'Film', name: 'Series', genre_ids: params.page === 1 ? [28] : [18], overview: 'English description.' }], total_pages: 2 }
  } })
  const result = await catalog.search({ type, query: 'story', year: '2024', genre: '18', language: 'en-US' })
  assert.equal(result.scannedPages, 2)
  assert.equal(result.results[0].overview, 'English description.')
})

test('tuntematonta kieltä ei välitetä TMDB:lle', async () => {
  const catalog = createCatalogService({ get: () => assert.fail('Ei verkkokutsua') })
  await assert.rejects(catalog.nowPlaying('1', 'xx-XX'), { code: 'INVALID_LANGUAGE' })
  await assert.rejects(catalog.search({ query: 'story', language: ['en-US', 'fi-FI'] }), { status: 400 })
})
