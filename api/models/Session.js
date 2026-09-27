import { pool } from './db.js'

export async function selectSessionUser(tokenHash) {
  const result = await pool.query(
    `SELECT app_users.*
     FROM app_users
     JOIN app_sessions ON app_sessions.user_id = app_users.id
     WHERE app_sessions.token_hash = $1 AND app_sessions.expires_at > now()`,
    [tokenHash],
  )
  return result.rows[0]
}

export async function deleteSession(tokenHash) {
  await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [tokenHash])
}

// client on käyttäjän tallennuksen kanssa sama tietokantayhteys.
export async function insertSession(client, userId, session, previousHash) {
  await client.query('DELETE FROM app_sessions WHERE expires_at <= now() OR token_hash = $1', [
    previousHash,
  ])
  await client.query(
    'INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [session.hash, userId, session.expiresAt],
  )
}
