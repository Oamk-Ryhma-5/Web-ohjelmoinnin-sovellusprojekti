import { ApiError } from '../services/tmdbClient.js'

export function createAuthRepository(pool) {
  async function transaction(work) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      if (error.code === '23505') {
        throw new ApiError(409, 'Käyttäjänimi tai sähköpostiosoite on jo käytössä.', 'ACCOUNT_EXISTS')
      }
      throw error
    } finally { client.release() }
  }

  async function insertSession(client, userId, session, replacedHash) {
    await client.query('DELETE FROM app_sessions WHERE expires_at <= now() OR token_hash = $1', [replacedHash])
    await client.query('INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [session.hash, userId, session.expiresAt])
  }

  return {
    async findByEmail(email) {
      return (await pool.query('SELECT * FROM app_users WHERE email = $1', [email])).rows[0]
    },
    async findSessionUser(hash) {
      return (await pool.query(`SELECT u.* FROM app_users u JOIN app_sessions s ON s.user_id = u.id
        WHERE s.token_hash = $1 AND s.expires_at > now()`, [hash])).rows[0]
    },
    async register({ username, email, passwordHash }, session, replacedHash) {
      return transaction(async client => {
        const { rows: [user] } = await client.query(`INSERT INTO app_users (username, email, password_hash)
          VALUES ($1, $2, $3) RETURNING *`, [username, email, passwordHash])
        await insertSession(client, user.id, session, replacedHash)
        return user
      })
    },
    async login(userId, expectedHash, session, replacedHash) {
      return transaction(async client => {
        // Salasanan vaihdon kanssa kilpaileva kirjautuminen ei saa vanhalla salasanalla uutta istuntoa.
        const { rows: [user] } = await client.query(
          'SELECT * FROM app_users WHERE id = $1 AND password_hash = $2 FOR UPDATE', [userId, expectedHash])
        if (!user) throw new ApiError(401, 'Sähköpostiosoite tai salasana on väärin.', 'INVALID_CREDENTIALS')
        await insertSession(client, user.id, session, replacedHash)
        return user
      })
    },
    async logout(hash) {
      await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [hash])
    },
    async updateProfile(userId, username) {
      return transaction(async client => (await client.query(
        'UPDATE app_users SET username = $2, updated_at = now() WHERE id = $1 RETURNING *',
        [userId, username])).rows[0])
    },
    async changePassword(userId, expectedHash, passwordHash, session) {
      return transaction(async client => {
        const { rows: [user] } = await client.query(`UPDATE app_users SET password_hash = $3, updated_at = now()
          WHERE id = $1 AND password_hash = $2 RETURNING *`, [userId, expectedHash, passwordHash])
        if (!user) throw new ApiError(409, 'Tiedot muuttuivat. Kirjaudu uudelleen.', 'ACCOUNT_CHANGED')
        await client.query('DELETE FROM app_sessions WHERE user_id = $1', [userId])
        await insertSession(client, userId, session, null)
        return user
      })
    },
  }
}
