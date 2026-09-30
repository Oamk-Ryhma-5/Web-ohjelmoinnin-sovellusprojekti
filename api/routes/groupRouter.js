import { Router } from 'express'
import { pool } from '../models/db.js'

const groupRouter = Router()

// 1. Hakee kaikki ryhmät (Vaatimus 7 - Julkinen lista)
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

// 4. Poistaa ryhmän (Vaatimus 7 - Omistaja/Admin)
groupRouter.delete('/:id', async (req, res, next) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM groups WHERE id = $1', [id])
    res.json({ message: 'Group deleted successfully', id: Number(id) })
  } catch (error) {
    next(error)
  }
})

// --- JÄSENET & LIITTYMISPYYNNÖT (Vaatimukset 8 & 9) ---

// Hakee ryhmän jäsenet ja odottavat pyynnöt
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

// Lähetä liittymispyyntö (Vaatimus 8)
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

// Omistaja hyväksyy tai hylkää pyynnön (Vaatimus 8)
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

// Poista jäsen tai poistu ryhmästä (Vaatimus 9)
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

// --- RYHMÄN ELOKUVAT (Vaatimus 10 - Ryhmäsivun kustomointi) ---

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

export default groupRouter