import { pool } from './db.js'
import { insertSession } from './Session.js'
import { ApiError } from '../helper/ApiError.js'

export async function selectUserByEmail(email) {
  const result = await pool.query('SELECT * FROM app_users WHERE email = $1', [email])
  return result.rows[0]
}

export async function insertUser(username, email, passwordHash, session, previousHash) {
  const client = await pool.connect()
  try {
    // Käyttäjä ja istunto tallennetaan yhdessä. Virhe peruu molemmat tallennukset.
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO app_users (username, email, password_hash)
       VALUES ($1, $2, $3) RETURNING *`,
      [username, email, passwordHash],
    )
    const user = result.rows[0]
    await insertSession(client, user.id, session, previousHash)
    await client.query('COMMIT')
    return user
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function signInUser(userId, passwordHash, session, previousHash) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Salasanan vaihto ei saa päästää samanaikaista kirjautumista läpi vanhalla salasanalla.
    const result = await client.query(
      'SELECT * FROM app_users WHERE id = $1 AND password_hash = $2 FOR UPDATE',
      [userId, passwordHash],
    )
    const user = result.rows[0]
    if (!user) {
      throw new ApiError('Sähköposti tai salasana on väärin.', 401, 'INVALID_CREDENTIALS')
    }
    await insertSession(client, user.id, session, previousHash)
    await client.query('COMMIT')
    return user
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateUsername(userId, username) {
  const result = await pool.query(
    'UPDATE app_users SET username = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [userId, username],
  )
  if (!result.rows[0]) {
    throw new ApiError('Kirjaudu uudelleen.', 401, 'UNAUTHENTICATED')
  }
  return result.rows[0]
}

export async function updatePassword(userId, oldHash, newHash, session) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `UPDATE app_users SET password_hash = $3, updated_at = now()
       WHERE id = $1 AND password_hash = $2 RETURNING *`,
      [userId, oldHash, newHash],
    )
    const user = result.rows[0]
    if (!user) {
      throw new ApiError('Tiedot muuttuivat. Kirjaudu uudelleen.', 409, 'ACCOUNT_CHANGED')
    }
    await client.query('DELETE FROM app_sessions WHERE user_id = $1', [userId])
    await insertSession(client, userId, session, null)
    await client.query('COMMIT')
    return user
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
