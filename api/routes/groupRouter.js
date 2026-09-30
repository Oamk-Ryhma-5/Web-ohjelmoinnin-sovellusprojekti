import { Router } from 'express'
import { pool } from '../models/db.js'

const groupRouter = Router()

// Hakee kaikki ryhmät
groupRouter.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM groups ORDER BY id DESC')
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// Luo uuden ryhmän
groupRouter.post('/', async (req, res, next) => {
  const { name, owner_id } = req.body
  if (!name) return res.status(400).json({ error: 'Group name is required' })

  try {
    const result = await pool.query(
      'INSERT INTO groups (name, owner_id) VALUES ($1, $2) RETURNING *',
      [name, owner_id || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Poistaa ryhmän ID:n perusteella
groupRouter.delete('/:id', async (req, res, next) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM groups WHERE id = $1', [id])
    res.json({ message: 'Group deleted successfully', id: Number(id) })
  } catch (error) {
    next(error)
  }
})

export default groupRouter