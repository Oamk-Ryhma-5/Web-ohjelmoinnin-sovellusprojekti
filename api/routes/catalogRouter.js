import { Router } from 'express'

export function createCatalogRouter(catalog) {
  const router = Router()
  router.get('/movies/now-playing', async (req, res) => {
    res.json(await catalog.nowPlaying(req.query.page, req.query.language))
  })
  router.get('/genres', async (req, res) => {
    res.json({ genres: await catalog.genres(req.query.type, req.query.language) })
  })
  router.get('/search', async (req, res) => {
    res.json(await catalog.search(req.query))
  })
  return router
}
