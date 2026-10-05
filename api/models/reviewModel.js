import { pool } from './db.js'

export const addReview = async (accountId, movieId, movieTitle, stars, reviewText) => {
    const result = await pool.query(
        `INSERT INTO reviews (account_id, movie_id, movie_title, stars, review_text)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [Number(accountId), String(movieId), movieTitle || '', Number(stars), reviewText]
    )
    return result.rows[0]
}

export const getMovieReviews = async (movieId) => {
    const result = await pool.query(
        `SELECT reviews.*, app_users.username
        FROM reviews
        JOIN app_users ON reviews.account_id = app_users.id
        WHERE reviews.movie_id = $1
        ORDER BY reviews.created_at DESC`,
        [String(movieId)]
    )
    return result.rows
}

export const getUserReview = async (accountId, movieId) => {
    const result = await pool.query(
        `SELECT * FROM reviews WHERE account_id = $1 AND movie_id = $2`,
        [Number(accountId), String(movieId)]
    )
    return result.rows[0]
}

export const updateReview = async (accountId, movieId, stars, reviewText) => {
    const result = await pool.query(
        `UPDATE reviews
        SET stars = $1, review_text = $2
        WHERE account_id = $3 AND movie_id = $4
        RETURNING *`,
        [Number(stars), reviewText, Number(accountId), String(movieId)]
    )
    return result.rows[0]
}

export const deleteReview = async (accountId, movieId) => {
    const result = await pool.query(
        `DELETE FROM reviews
         WHERE account_id = $1 AND movie_id = $2
         RETURNING *`,
        [Number(accountId), String(movieId)]
    )
    return result.rows[0]
}