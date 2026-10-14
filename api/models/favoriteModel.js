import { pool } from './db.js'

export const getUserFavorites = async (accountId) => {
  const result = await pool.query(
    'SELECT * FROM favorites WHERE account_id = $1 ORDER BY created_at DESC',
    [accountId]
  )
  return result.rows
}

export const addFavorite = async (accountId, movieId, movieTitle, posterPath, type = 'movie') => {
  const mediaType = type === 'tv' ? 'tv' : 'movie'
  
  const result = await pool.query(
    `INSERT INTO favorites (account_id, movie_id, movie_title, poster_path, type)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (account_id, movie_id) DO UPDATE 
     SET movie_title = EXCLUDED.movie_title, 
         poster_path = EXCLUDED.poster_path, 
         type = EXCLUDED.type
     RETURNING *`,
    [accountId, movieId, movieTitle, posterPath, mediaType]
  )
  return result.rows[0]
}

export const removeFavorite = async (accountId, movieId) => {
  const result = await pool.query(
    'DELETE FROM favorites WHERE account_id = $1 AND movie_id = $2 RETURNING *',
    [accountId, movieId]
  )
  return result.rows[0]
}