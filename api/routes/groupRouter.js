import { Router } from 'express'
import { pool } from '../models/db.js'

const groupRouter = Router()

// 1. Hakee kaikki ryhmät (Julkinen lista - kaikki näkevät ryhmät)
groupRouter.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM groups ORDER BY id DESC')
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// 2. Hakee yksittäisen ryhmän perustiedot
groupRouter.get('/:id', async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await pool.query('SELECT * FROM groups WHERE id = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Group not found' })
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// 3. Luo uuden ryhmän ja lisää luojan hyväksytyksi jäseneksi
groupRouter.post('/', async (req, res, next) => {
  const { name, owner_id } = req.body
  if (!name) return res.status(400).json({ error: 'Group name is required' })

  try {
    const result = await pool.query(
      'INSERT INTO groups (name, owner_id) VALUES ($1, $2) RETURNING *',
      [name, owner_id || null]
    )
    const newGroup = result.rows[0]

    if (owner_id) {
      await pool.query(
        "INSERT INTO group_members (group_id, user_id, status) VALUES ($1, $2, 'accepted')",
        [newGroup.id, owner_id]
      )
    }

    res.status(201).json(newGroup)
  } catch (error) {
    next(error)
  }
})

// 4. Poistaa ryhmän (Vain omistaja)
groupRouter.delete('/:id', async (req, res, next) => {
  const { id } = req.params
  const userId = req.body?.user_id || req.headers['x-user-id']

  try {
    const groupResult = await pool.query('SELECT owner_id FROM groups WHERE id = $1', [id])
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' })
    }

    const group = groupResult.rows[0]

    if (userId && String(group.owner_id) !== String(userId)) {
      return res.status(403).json({ error: 'Only group owner can delete the group' })
    }

    await pool.query('DELETE FROM groups WHERE id = $1', [id])
    res.json({ message: 'Group deleted successfully', id: Number(id) })
  } catch (error) {
    next(error)
  }
})

// --- JÄSENET & LIITTYMISPYYNNÖT ---

// Hakee ryhmän jäsenet
groupRouter.get('/:id/members', async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      `SELECT gm.user_id, gm.status, u.username 
       FROM group_members gm
       JOIN app_users u ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [id]
    )
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// Lähetä liittymispyyntö
groupRouter.post('/:id/request', async (req, res, next) => {
  const { id } = req.params
  const { user_id } = req.body
  try {
    await pool.query(
      "INSERT INTO group_members (group_id, user_id, status) VALUES ($1, $2, 'pending')",
      [id, user_id]
    )
    res.status(201).json({ message: 'Join request sent' })
  } catch (error) {
    next(error)
  }
})

// Omistaja hyväksyy tai hylkää pyynnön
groupRouter.put('/:id/requests/:userId', async (req, res, next) => {
  const { id, userId } = req.params
  const { action } = req.body // 'accept' tai 'reject'

  try {
    if (action === 'accept') {
      await pool.query(
        "UPDATE group_members SET status = 'accepted' WHERE group_id = $1 AND user_id = $2",
        [id, userId]
      )
      res.json({ message: 'Request accepted' })
    } else {
      await pool.query(
        "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2",
        [id, userId]
      )
      res.json({ message: 'Request rejected' })
    }
  } catch (error) {
    next(error)
  }
})

// Poista jäsen tai poistu ryhmästä
groupRouter.delete('/:id/members/:userId', async (req, res, next) => {
  const { id, userId } = req.params
  try {
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, userId]
    )
    res.json({ message: 'Member removed successfully' })
  } catch (error) {
    next(error)
  }
})

// --- RYHMÄN ELOKUVAT ---

// Hakee ryhmän elokuvat
groupRouter.get('/:id/movies', async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      'SELECT * FROM group_movies WHERE group_id = $1 ORDER BY added_at DESC',
      [id]
    )
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// Lisää elokuvan ryhmän sivulle
groupRouter.post('/:id/movies', async (req, res, next) => {
  const { id } = req.params
  const { movie_id, movie_title, poster_path, added_by } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO group_movies (group_id, movie_id, movie_title, poster_path, added_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, movie_id, movie_title, poster_path, added_by]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Poistaa elokuvan ryhmän sivulta (Vain ryhmän omistaja tai hyväksytty jäsen)
groupRouter.delete('/:id/movies/:movieId', async (req, res, next) => {
  const { id, movieId } = req.params
  const userId = req.body?.user_id || req.headers['x-user-id']

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Kirjaudu sisään poistaaksesi elokuvia.' })
  }

  try {
    // Tarkistetaan onko käyttäjä ryhmän omistaja tai hyväksytty jäsen tietokannasta
    const memberCheck = await pool.query(
      `SELECT 1 FROM groups WHERE id = $1 AND owner_id = $2
       UNION
       SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'accepted'`,
      [id, userId]
    )

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Vain ryhmän jäsenet voivat poistaa elokuvia.' })
    }

    const result = await pool.query(
      'DELETE FROM group_movies WHERE group_id = $1 AND (movie_id = $2 OR movie_id = $3)',
      [id, movieId, Number(movieId) || 0]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Movie not found in group' })
    }

    res.json({ message: 'Movie removed from group successfully' })
  } catch (error) {
    console.error('Virhe elokuvan poistossa backendissä:', error)
    next(error)
  }
})

export default groupRouter