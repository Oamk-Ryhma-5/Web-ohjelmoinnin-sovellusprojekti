<<<<<<< HEAD
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
=======
import test, { before, after, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createHash } from 'node:crypto'
import app from '../app.js'
import { pool } from '../models/db.js'
import { migrate } from '../models/migrate.js'
import { hashPassword } from '../helper/password.js'
import { deleteUser } from '../models/User.js'
import { createTestDatabase } from './helpers/database.js'

const user = { username: 'Testaaja', email: 'test@example.com', password: 'Testi123' }
let database
let server
let address
let requestNumber = 0

before(async () => {
  database = await createTestDatabase()
  mock.method(pool, 'query', (...args) => database.query(...args))
  mock.method(pool, 'connect', () => database.connect())
  await migrate(pool)
  // Vain testissä sallitaan oma IP-otsake, jotta testit eivät kuluta toistensa yritysrajaa.
  app.set('trust proxy', 'loopback')
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  address = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server?.closeAllConnections()
  if (server) await new Promise((resolve) => server.close(resolve))
  mock.restoreAll()
  await pool.end()
  await database?.end()
})

beforeEach(async () => {
  requestNumber += 1
  await database.query('TRUNCATE app_users RESTART IDENTITY CASCADE')
})

async function request(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  const response = await fetch(`${address}/api/auth${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Leffahaku-Request': '1',
      'X-Forwarded-For': `10.0.0.${requestNumber}`,
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  return {
    status: response.status,
    headers: response.headers,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
    body: response.status === 204 ? null : await response.json(),
  }
}

function register(details = user) {
  return request('/register', { method: 'POST', body: details })
}

test('tietokantapäivitys säilyttää olemassa olevat tiedot ja ajetaan vain kerran', async () => {
  await register()
  await database.query("CREATE TABLE old_data (text TEXT); INSERT INTO old_data VALUES ('säilyy')")
  await migrate(pool)
  await migrate(pool)
  assert.equal((await database.query('SELECT * FROM app_users')).rows.length, 1)
  assert.equal((await database.query('SELECT * FROM old_data')).rows[0].text, 'säilyy')
  assert.equal((await database.query('SELECT * FROM leffahaku_migrations')).rows.length, 1)
})

test('rekisteröinti tallentaa käyttäjän sekä salasanan ja istunnon tiivisteet', async () => {
  const result = await register({ ...user, email: ' TEST@Example.COM ' })
  assert.equal(result.status, 201)
  assert.equal(result.body.user.email, 'test@example.com')
  assert.deepEqual(Object.keys(result.body.user).sort(), ['createdAt', 'email', 'id', 'username'])
>>>>>>> origin/yhdistetty-versio
  assert.match(result.headers.get('set-cookie'), /HttpOnly/)
  assert.match(result.headers.get('set-cookie'), /SameSite=Lax/)
  assert.match(result.headers.get('set-cookie'), /Path=\/api/)
  assert.equal(result.headers.get('cache-control'), 'no-store')
<<<<<<< HEAD
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
=======
  const savedUser = (await database.query('SELECT * FROM app_users')).rows[0]
  assert.match(savedUser.password_hash, /^scrypt\$/)
  assert.notEqual(savedUser.password_hash, user.password)
  const session = (await database.query('SELECT * FROM app_sessions')).rows[0]
  const token = result.cookie.split('=')[1]
  assert.equal(session.token_hash, createHash('sha256').update(token).digest('hex'))
  assert.equal((await request('/me', { cookie: result.cookie })).status, 200)
})

test('uuden salasanan 8 merkkiä, iso kirjain ja numero tarkistetaan työohjeen mukaan', async () => {
  for (const password of ['Test123', 'testi123', 'TestiAbc', 'a'.repeat(129), []]) {
    const result = await register({ ...user, password })
    assert.equal(result.status, 400)
    assert.equal(result.body.error.code, 'INVALID_PASSWORD')
  }
  assert.equal((await register()).status, 201)
})

test('virheellinen sähköposti, käyttäjänimi ja JSON hylätään palvelimella', async () => {
  for (const values of [
    { email: 'not-email' },
    { username: 'ab' },
    { username: '<script>' },
    { username: {} },
  ]) {
    assert.equal((await register({ ...user, ...values })).status, 400)
  }
  const invalidJson = await fetch(`${address}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Leffahaku-Request': '1' },
    body: '{broken',
  })
  assert.equal(invalidJson.status, 400)
  assert.equal((await database.query('SELECT * FROM app_users')).rows.length, 0)
})

test('sama sähköposti tai käyttäjänimi ei luo toista käyttäjää', async () => {
  await register()
  assert.equal(
    (await register({ ...user, username: 'Toinen', email: 'TEST@example.com' })).status,
    409,
  )
  assert.equal(
    (await register({ ...user, username: 'TESTAAJA', email: 'second@example.com' })).status,
    409,
  )
  assert.equal((await database.query('SELECT * FROM app_users')).rows.length, 1)
  assert.equal((await database.query('SELECT * FROM app_sessions')).rows.length, 1)
})

test('kirjautuminen toimii, normalisoi sähköpostin ja vaihtaa vanhan istunnon', async () => {
  const created = await register()
  const signedIn = await request('/login', {
    method: 'POST',
    cookie: created.cookie,
    body: { email: 'TEST@EXAMPLE.COM', password: user.password },
  })
  assert.equal(signedIn.status, 200)
  assert.notEqual(created.cookie, signedIn.cookie)
  assert.equal((await request('/me', { cookie: created.cookie })).status, 401)
  assert.equal(
    (await request('/me', { cookie: signedIn.cookie })).body.user.username,
    user.username,
  )
})

test('väärä salasana ja olematon käyttäjä antavat saman vastauksen', async () => {
  await register()
  const wrong = await request('/login', { method: 'POST', body: { ...user, password: 'Wrong123' } })
  const unknown = await request('/login', {
    method: 'POST',
    body: { ...user, email: 'missing@example.com' },
  })
>>>>>>> origin/yhdistetty-versio
  assert.equal(wrong.status, 401)
  assert.deepEqual(wrong.body, unknown.body)
  assert.equal(wrong.cookie, undefined)
})

<<<<<<< HEAD
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
=======
test('ennen uudistusta luotu käyttäjä voi kirjautua entisellä salasanallaan', async () => {
  const oldPassword = 'vanha pitkä testisalasana'
  await database.query(
    'INSERT INTO app_users (username, email, password_hash) VALUES ($1, $2, $3)',
    [user.username, user.email, await hashPassword(oldPassword)],
  )
  const result = await request('/login', {
    method: 'POST',
    body: { email: user.email, password: oldPassword },
  })
  assert.equal(result.status, 200)
})

test('uloskirjautuminen poistaa istunnon palvelimelta ja selaimelta', async () => {
  const { cookie } = await register()
  const result = await request('/logout', { method: 'POST', cookie, body: {} })
  assert.equal(result.status, 204)
  assert.match(result.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/)
  assert.equal((await request('/me', { cookie })).status, 401)
  assert.equal((await database.query('SELECT * FROM app_sessions')).rows.length, 0)
  assert.equal((await request('/logout', { method: 'POST', body: {} })).status, 204)
})

test('puuttuva, väärennetty ja vanhentunut istunto eivät pääse omiin tietoihin', async () => {
  assert.equal((await request('/me')).status, 401)
  assert.equal(
    (await request('/me', { cookie: `leffahaku_session=${'x'.repeat(43)}` })).status,
    401,
  )
  assert.equal((await request('/me', { cookie: 'leffahaku_session=%ZZ' })).status, 401)
  const { cookie } = await register()
  await database.query("UPDATE app_sessions SET expires_at = now() - interval '1 second'")
  assert.equal((await request('/me', { cookie })).status, 401)
})

test('profiilimuutos koskee vain istunnon käyttäjää', async () => {
  const first = await register()
  const second = await register({ ...user, username: 'Toinen', email: 'second@example.com' })
  const result = await request('/profile', {
    method: 'PATCH',
    cookie: first.cookie,
    body: { username: 'UusiNimi', id: second.body.user.id, email: 'attack@example.com' },
  })
  assert.equal(result.status, 200)
  assert.equal(result.body.user.id, first.body.user.id)
  assert.equal(result.body.user.email, user.email)
  assert.equal((await request('/me', { cookie: second.cookie })).body.user.username, 'Toinen')
  assert.equal(
    (await request('/profile', { method: 'PATCH', body: { username: 'NoLogin' } })).status,
    401,
  )
  assert.equal(
    (
      await request('/profile', {
        method: 'PATCH',
        cookie: first.cookie,
        body: { username: 'TOINEN' },
      })
    ).status,
    409,
  )
})

test('salasanan vaihto tarkistaa vanhan salasanan sekä uudet salasanavaatimukset', async () => {
  const { cookie } = await register()
  for (const body of [
    { currentPassword: 'Wrong123', password: 'Uusi1234' },
    { currentPassword: user.password, password: user.password },
    { currentPassword: user.password, password: 'no-uppercase1' },
  ]) {
    assert.equal((await request('/password', { method: 'POST', cookie, body })).status, 400)
  }
})

test('salasanan vaihto sulkee muut istunnot ja avaa uuden nykyiselle selaimelle', async () => {
  const first = await register()
  const second = await request('/login', { method: 'POST', body: user })
  const changed = await request('/password', {
    method: 'POST',
    cookie: first.cookie,
    body: { currentPassword: user.password, password: 'Uusi1234' },
  })
  assert.equal(changed.status, 200)
  assert.equal((await request('/me', { cookie: first.cookie })).status, 401)
  assert.equal((await request('/me', { cookie: second.cookie })).status, 401)
  assert.equal((await request('/me', { cookie: changed.cookie })).status, 200)
  assert.equal((await request('/login', { method: 'POST', body: user })).status, 401)
  assert.equal(
    (await request('/login', { method: 'POST', body: { ...user, password: 'Uusi1234' } })).status,
    200,
  )
})

test('vieras alkuperä ja puuttuva pyyntöotsake estetään', async () => {
  for (const headers of [
    { Origin: 'https://untrusted.example' },
    { Origin: 'null' },
    { 'X-Leffahaku-Request': '' },
    { 'Content-Type': 'text/plain' },
  ]) {
    assert.equal((await request('/register', { method: 'POST', body: user, headers })).status, 403)
  }
  assert.equal(
    (
      await request('/register', {
        method: 'POST',
        body: user,
        headers: { Origin: 'http://localhost:5173' },
      })
    ).status,
    201,
  )
})

test('käyttäjän tallennus perutaan kokonaan, jos istunnon tallennus epäonnistuu', async () => {
  await database.query('ALTER TABLE app_sessions ADD CONSTRAINT test_failure CHECK (false)')
  try {
    assert.equal((await register()).status, 500)
    assert.equal((await database.query('SELECT * FROM app_users')).rows.length, 0)
  } finally {
    await database.query('ALTER TABLE app_sessions DROP CONSTRAINT test_failure')
  }
})

test('SQL-syöte pysyy parametrina eikä ohita kirjautumista', async () => {
  await register()
  const result = await request('/login', {
    method: 'POST',
    body: { email: "x'OR'1'='1@example.com", password: user.password },
  })
  assert.equal(result.status, 401)
  assert.equal((await database.query('SELECT * FROM app_users')).rows.length, 1)
})

test('toistuvat kirjautumisyritykset rajoitetaan', async () => {
  for (let count = 0; count < 30; count += 1) {
    assert.equal((await request('/login', { method: 'POST', body: {} })).status, 400)
  }
  const denied = await request('/login', { method: 'POST', body: {} })
  assert.equal(denied.status, 429)
  assert.ok(Number(denied.headers.get('retry-after')) > 0)
})

test('HTTPS-asetus lisää Secure-evästeen', async () => {
  const previous = process.env.SESSION_COOKIE_SECURE
  process.env.SESSION_COOKIE_SECURE = 'true'
  try {
    assert.match((await register()).headers.get('set-cookie'), /; Secure/)
  } finally {
    if (previous === undefined) delete process.env.SESSION_COOKIE_SECURE
    else process.env.SESSION_COOKIE_SECURE = previous
  }
})

test('tilin poisto poistaa vain istunnon käyttäjän ja kaikki hänen istuntonsa', async () => {
  const first = await register()
  const otherSession = await request('/login', { method: 'POST', body: user })
  const second = await register({ ...user, username: 'Toinen', email: 'second@example.com' })
  const removed = await request('/account', {
    method: 'DELETE',
    cookie: first.cookie,
    // Selaimesta lähetetty toisen käyttäjän id ei saa vaikuttaa poistoon.
    body: { password: user.password, id: second.body.user.id, email: 'second@example.com' },
  })
  assert.equal(removed.status, 204)
  assert.match(removed.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/)
  assert.equal(removed.headers.get('cache-control'), 'no-store')
  assert.equal((await request('/me', { cookie: first.cookie })).status, 401)
  assert.equal((await request('/me', { cookie: otherSession.cookie })).status, 401)
  assert.equal((await request('/me', { cookie: second.cookie })).status, 200)
  assert.deepEqual((await database.query('SELECT id FROM app_users')).rows, [
    { id: second.body.user.id },
  ])
  assert.deepEqual((await database.query('SELECT user_id FROM app_sessions')).rows, [
    { user_id: second.body.user.id },
  ])
  assert.equal((await request('/login', { method: 'POST', body: user })).status, 401)
  assert.equal((await register()).status, 201)
})

test('väärä, puuttuva tai virheellinen salasana ei poista tiliä', async () => {
  const { cookie } = await register()
  for (const password of [undefined, '', [], 'x'.repeat(129), 'Wrong123']) {
    const result = await request('/account', { method: 'DELETE', cookie, body: { password } })
    assert.equal(result.status, 400)
    assert.equal(result.cookie, undefined)
  }
  assert.equal((await request('/me', { cookie })).status, 200)
  assert.equal((await database.query('SELECT * FROM app_users')).rows.length, 1)
  assert.equal((await database.query('SELECT * FROM app_sessions')).rows.length, 1)
})

test('tiliä ei voi poistaa ilman voimassa olevaa kirjautumista', async () => {
  const registered = await register()
  for (const cookie of [undefined, `leffahaku_session=${'x'.repeat(43)}`]) {
    const result = await request('/account', {
      method: 'DELETE',
      cookie,
      body: { password: user.password },
    })
    assert.equal(result.status, 401)
  }
  await database.query("UPDATE app_sessions SET expires_at = now() - interval '1 second'")
  assert.equal(
    (
      await request('/account', {
        method: 'DELETE',
        cookie: registered.cookie,
        body: { password: user.password },
      })
    ).status,
    401,
  )
  assert.equal((await database.query('SELECT * FROM app_users')).rows.length, 1)
})

test('tilin poistossa vaaditaan oman sovelluksen pyyntöotsakkeet', async () => {
  const { cookie } = await register()
  for (const headers of [
    { Origin: 'https://untrusted.example' },
    { 'X-Leffahaku-Request': '' },
    { 'Content-Type': 'text/plain' },
  ]) {
    const result = await request('/account', {
      method: 'DELETE',
      cookie,
      body: { password: user.password },
      headers,
    })
    assert.equal(result.status, 403)
  }
  assert.equal((await request('/me', { cookie })).status, 200)
})

test('tilin poiston salasanayrityksiä rajoitetaan', async () => {
  const { cookie } = await register()
  // Rekisteröinti käytti saman IP:n 30 yrityksestä ensimmäisen.
  for (let count = 0; count < 29; count += 1) {
    assert.equal((await request('/account', { method: 'DELETE', cookie, body: {} })).status, 400)
  }
  const result = await request('/account', { method: 'DELETE', cookie, body: {} })
  assert.equal(result.status, 429)
  assert.ok(Number(result.headers.get('retry-after')) > 0)
  assert.equal((await request('/me', { cookie })).status, 200)
})

test('salasanan samanaikainen vaihtuminen estää tilin poiston vanhalla tarkistuksella', async () => {
  await register()
  const saved = (await database.query('SELECT * FROM app_users')).rows[0]
  await database.query('UPDATE app_users SET password_hash = $1 WHERE id = $2', [
    await hashPassword('Uusi1234'),
    saved.id,
  ])
  await assert.rejects(deleteUser(saved.id, saved.password_hash), { code: 'ACCOUNT_CHANGED' })
  assert.equal((await database.query('SELECT * FROM app_users')).rows.length, 1)
  assert.equal((await database.query('SELECT * FROM app_sessions')).rows.length, 1)
>>>>>>> origin/yhdistetty-versio
})
