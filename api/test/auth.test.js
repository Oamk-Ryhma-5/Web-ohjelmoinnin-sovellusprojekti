import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createHash } from 'node:crypto'
import { createApp } from '../app.js'
import { createAuthRepository } from '../models/authRepository.js'
import { migrate } from '../models/migrate.js'
import { createTestDatabase } from './helpers/database.js'

let db
const details = { username: 'Testaaja', email: 'test@example.com', password: 'oma pitkä testisalasana' }
before(async () => { db = await createTestDatabase(); await migrate(db) })
after(async () => { await db?.end() })
beforeEach(async () => { await db.query('TRUNCATE app_users RESTART IDENTITY CASCADE') })

async function serverFor(t, options = {}) {
  const app = createApp({ auth: createAuthRepository(db), authOptions: options })
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  return async (path, { method = 'GET', body, cookie, headers = {} } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Leffahaku-Request': '1', ...(cookie ? { Cookie: cookie } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    return { status: response.status, headers: response.headers, cookie: response.headers.get('set-cookie')?.split(';')[0], body: response.status === 204 ? null : await response.json() }
  }
}

test('tietokantapäivitys on toistettava ja säilyttää aikaisemmat taulut ja käyttäjät', async t => {
  const request = await serverFor(t)
  await request('/register', { method: 'POST', body: details })
  await db.query("CREATE TABLE old_project_data (value TEXT); INSERT INTO old_project_data VALUES ('säilyy')")
  await migrate(db)
  await migrate(db)
  assert.equal((await db.query('SELECT * FROM app_users')).rows.length, 1)
  assert.equal((await db.query('SELECT * FROM old_project_data')).rows[0].value, 'säilyy')
  assert.equal((await db.query('SELECT * FROM leffahaku_migrations')).rows.length, 1)
})

test('rekisteröinti tallentaa oikean käyttäjän, tiivisteet ja HttpOnly-istunnon', async t => {
  const request = await serverFor(t)
  const result = await request('/register', { method: 'POST', body: { ...details, email: ' TEST@Example.COM ' } })
  assert.equal(result.status, 201)
  assert.equal(result.body.user.email, 'test@example.com')
  assert.match(result.headers.get('set-cookie'), /HttpOnly/)
  assert.match(result.headers.get('set-cookie'), /SameSite=Lax/)
  assert.match(result.headers.get('set-cookie'), /Path=\/api/)
  assert.equal(result.headers.get('cache-control'), 'no-store')
  assert.deepEqual(Object.keys(result.body.user).sort(), ['createdAt', 'email', 'id', 'username'])
  const stored = (await db.query('SELECT * FROM app_users')).rows[0]
  assert.notEqual(stored.password_hash, details.password)
  assert.match(stored.password_hash, /^scrypt\$/)
  const rawToken = result.cookie.split('=')[1]
  const session = (await db.query('SELECT * FROM app_sessions')).rows[0]
  assert.equal(session.token_hash, createHash('sha256').update(rawToken).digest('hex'))
  assert.equal((await request('/me', { cookie: result.cookie })).body.user.username, details.username)
})

test('tuotannon eväste on Secure', async t => {
  const request = await serverFor(t, { secureCookies: true })
  const response = await request('/register', { method: 'POST', body: details })
  assert.match(response.headers.get('set-cookie'), /; Secure/)
})

test('tuntematon, väärennetty ja vanhentunut istunto hylätään', async t => {
  const request = await serverFor(t)
  assert.equal((await request('/me')).status, 401)
  assert.equal((await request('/me', { cookie: `leffahaku_session=${'x'.repeat(43)}` })).status, 401)
  assert.equal((await request('/me', { cookie: 'leffahaku_session=%ZZ' })).status, 401)
  const registration = await request('/register', { method: 'POST', body: details })
  await db.query("UPDATE app_sessions SET expires_at = now() - interval '1 second'")
  assert.equal((await request('/me', { cookie: registration.cookie })).status, 401)
})

test('käyttäjä ja istunto säilyvät palvelinsovelluksen uudelleenkäynnistyksessä', async t => {
  const first = await serverFor(t)
  const registration = await first('/register', { method: 'POST', body: details })
  const second = await serverFor(t)
  assert.equal((await second('/me', { cookie: registration.cookie })).body.user.email, details.email)
  assert.equal((await second('/login', { method: 'POST', body: details })).status, 200)
})

test('uloskirjautuminen mitätöi istunnon palvelimella ja tyhjentää evästeen', async t => {
  const request = await serverFor(t)
  const { cookie } = await request('/register', { method: 'POST', body: details })
  const logout = await request('/logout', { method: 'POST', body: {}, cookie })
  assert.equal(logout.status, 204)
  assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/)
  assert.equal((await request('/me', { cookie })).status, 401)
  assert.equal((await request('/logout', { method: 'POST', body: {} })).status, 204)
})

test('kirjautuminen toimii kirjainkoosta riippumatta ja vaihtaa istuntotunnuksen', async t => {
  const request = await serverFor(t)
  const registered = await request('/register', { method: 'POST', body: details })
  const signedIn = await request('/login', { method: 'POST', cookie: registered.cookie, body: { ...details, email: 'TEST@EXAMPLE.COM' } })
  assert.equal(signedIn.status, 200)
  assert.notEqual(signedIn.cookie, registered.cookie)
  assert.equal((await request('/me', { cookie: registered.cookie })).status, 401)
  assert.equal((await request('/me', { cookie: signedIn.cookie })).status, 200)
})

test('väärä salasana ja puuttuva käyttäjä antavat saman virheen', async t => {
  const request = await serverFor(t)
  await request('/register', { method: 'POST', body: details })
  const wrong = await request('/login', { method: 'POST', body: { ...details, password: 'väärä salasana' } })
  const unknown = await request('/login', { method: 'POST', body: { ...details, email: 'unknown@example.com' } })
  assert.equal(wrong.status, 401)
  assert.deepEqual(wrong.body, unknown.body)
  assert.equal(wrong.cookie, undefined)
})

test('päällekkäinen sähköposti tai käyttäjänimi ei luo toista tiliä tai istuntoa', async t => {
  const request = await serverFor(t)
  await request('/register', { method: 'POST', body: details })
  const duplicateEmail = await request('/register', { method: 'POST', body: { ...details, username: 'Toinen', email: 'TEST@example.com' } })
  const duplicateName = await request('/register', { method: 'POST', body: { ...details, username: 'TESTAAJA', email: 'second@example.com' } })
  assert.equal(duplicateEmail.status, 409)
  assert.equal(duplicateName.status, 409)
  assert.equal((await db.query('SELECT * FROM app_users')).rows.length, 1)
  assert.equal((await db.query('SELECT * FROM app_sessions')).rows.length, 1)
})

test('palvelin validoi tiedot, vaikka lomakkeen tarkistukset ohitetaan', async t => {
  const request = await serverFor(t)
  for (const patch of [{ username: 'ab' }, { username: '<script>alert(1)</script>' }, { username: {} }, { email: 'not-email' }, { password: 'short' }, { password: 'a'.repeat(129) }, { password: [] }]) {
    const result = await request('/register', { method: 'POST', body: { ...details, ...patch } })
    assert.equal(result.status, 400)
  }
  assert.equal((await db.query('SELECT * FROM app_users')).rows.length, 0)
})

test('profiilimuutos on suojattu ja koskee vain istunnon käyttäjää', async t => {
  const request = await serverFor(t)
  const a = await request('/register', { method: 'POST', body: details })
  const b = await request('/register', { method: 'POST', body: { ...details, username: 'Toinen', email: 'second@example.com' } })
  assert.equal((await request('/profile', { method: 'PATCH', body: { username: 'Muutos' } })).status, 401)
  const updated = await request('/profile', { method: 'PATCH', cookie: a.cookie, body: { id: b.body.user.id, username: 'UusiNimi', email: 'attack@example.com' } })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.user.id, a.body.user.id)
  assert.equal(updated.body.user.email, details.email)
  assert.equal((await request('/me', { cookie: b.cookie })).body.user.username, 'Toinen')
  assert.equal((await request('/profile', { method: 'PATCH', cookie: a.cookie, body: { username: 'TOINEN' } })).status, 409)
})

test('salasanan vaihto tarkistaa nykyisen salasanan ja mitätöi kaikki vanhat istunnot', async t => {
  const request = await serverFor(t)
  const a = await request('/register', { method: 'POST', body: details })
  const b = await request('/login', { method: 'POST', body: details })
  const password = 'täysin uusi pitkä salasana'
  assert.equal((await request('/password', { method: 'POST', cookie: a.cookie, body: { currentPassword: 'wrong', password } })).status, 400)
  assert.equal((await request('/password', { method: 'POST', cookie: a.cookie, body: { currentPassword: details.password, password: details.password } })).status, 400)
  const changed = await request('/password', { method: 'POST', cookie: a.cookie, body: { currentPassword: details.password, password } })
  assert.equal(changed.status, 200)
  assert.equal((await request('/me', { cookie: a.cookie })).status, 401)
  assert.equal((await request('/me', { cookie: b.cookie })).status, 401)
  assert.equal((await request('/me', { cookie: changed.cookie })).status, 200)
  assert.equal((await request('/login', { method: 'POST', body: details })).status, 401)
  assert.equal((await request('/login', { method: 'POST', body: { ...details, password } })).status, 200)
})

test('vieras alkuperä, puuttuva CSRF-otsake ja väärä sisältötyyppi torjutaan', async t => {
  const request = await serverFor(t)
  for (const headers of [{ Origin: 'https://untrusted.example' }, { Origin: 'null' }, { 'X-Leffahaku-Request': '' }, { 'Content-Type': 'text/plain' }]) {
    assert.equal((await request('/register', { method: 'POST', body: details, headers })).status, 403)
  }
  const valid = await request('/register', { method: 'POST', body: details, headers: { Origin: 'http://localhost:5173' } })
  assert.equal(valid.status, 201)
  assert.equal(valid.headers.get('access-control-allow-origin'), 'http://localhost:5173')
})

test('kirjautumisen yritysraja pysäyttää toistetut pyynnöt ja päättyy ajallaan', async t => {
  let now = 0
  const request = await serverFor(t, { rateLimit: { limit: 2, windowMs: 1000, now: () => now } })
  for (let i = 0; i < 2; i++) assert.equal((await request('/login', { method: 'POST', body: {} })).status, 400)
  const denied = await request('/login', { method: 'POST', body: {} })
  assert.equal(denied.status, 429)
  assert.equal(denied.headers.get('retry-after'), '1')
  now = 1001
  assert.equal((await request('/login', { method: 'POST', body: {} })).status, 400)
})

test('SQL-syötteet pysyvät parametreina eivätkä kirjaa käyttäjää sisään', async t => {
  const request = await serverFor(t)
  await request('/register', { method: 'POST', body: details })
  const result = await request('/login', { method: 'POST', body: { email: "x'OR'1'='1@example.com", password: details.password } })
  assert.equal(result.status, 401)
  assert.equal((await db.query('SELECT * FROM app_users')).rows.length, 1)
})
