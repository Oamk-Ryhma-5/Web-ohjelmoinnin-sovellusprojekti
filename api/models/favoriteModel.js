import { pool } from './db.js'

export const addFavorite = async (accountId, movieId, movieTitle, posterPath) => {
  const result = await pool.query(
    `INSERT INTO favorites (account_id, movie_id, movie_title, poster_path)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (account_id, movie_id) DO NOTHING
     RETURNING *`,
    [Number(accountId), String(movieId), movieTitle || '', posterPath || '']
  )
  return result.rows[0] || { message: 'Elokuva oli jo suosikeissasi' }
}

export const getUserFavorites = async (accountId) => {
  const result = await pool.query(
    'SELECT * FROM favorites WHERE account_id = $1 ORDER BY created_at DESC',
    [Number(accountId)]
  )
  return result.rows
}

export const removeFavorite = async (accountId, movieId) => {
  const result = await pool.query(
    'DELETE FROM favorites WHERE account_id = $1 AND movie_id = $2 RETURNING *',
    [Number(accountId), String(movieId)]
  )
  return result.rows[0]
}