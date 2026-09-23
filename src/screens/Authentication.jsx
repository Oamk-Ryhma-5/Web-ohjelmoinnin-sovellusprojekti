import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '../context/useUser.js'
import { useLanguage } from '../context/useLanguage.js'
import { errorMessage } from '../api.js'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Authentication({ mode }) {
  const { user, loading, signIn, signUp } = useUser()
  const { texts } = useLanguage()
  const navigate = useNavigate()
  const register = mode === 'register'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError(null)
    if (register && password !== confirmation) {
      setError({ code: 'PASSWORD_MISMATCH' })
      return
    }
    setSaving(true)
    try {
      if (register) await signUp(username, email, password)
      else await signIn(email, password)
      navigate('/omat-tiedot', { replace: true })
    } catch (error) {
      setError(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <p className="status-message" role="status">
        {texts.loading}
      </p>
    )
  if (user) return <Navigate to="/omat-tiedot" replace />

  return (
    <section className="auth-layout">
      <div className="auth-panel panel">
        <h1>{register ? texts.signUp : texts.signIn}</h1>
        <p className="muted">{register ? texts.registerText : texts.loginText}</p>
        <form onSubmit={submit}>
          {register && (
            <div className="form-field">
              <label htmlFor="username">{texts.username}</label>
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                minLength={3}
                maxLength={30}
                aria-describedby="username-help"
              />
              <small id="username-help">{texts.usernameHelp}</small>
            </div>
          )}
          <div className="form-field">
            <label htmlFor="email">{texts.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              maxLength={254}
            />
          </div>
          <PasswordInput
            id="password"
            label={texts.password}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={register ? 'new-password' : 'current-password'}
            minLength={register ? 8 : 1}
          />
          {register && (
            <>
              <p className="field-help">{texts.passwordHelp}</p>
              <PasswordInput
                id="confirmation"
                label={texts.passwordAgain}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {errorMessage(error, texts)}
            </p>
          )}
          <button className="button full-width" type="submit" disabled={saving}>
            {saving ? texts.loading : register ? texts.signUp : texts.signIn}
          </button>
        </form>
        <p className="auth-switch">
          {register ? texts.alreadyAccount : texts.noAccount}{' '}
          <Link to={register ? '/kirjaudu' : '/rekisteroidy'}>
            {register ? texts.signIn : texts.signUp}
          </Link>
        </p>
      </div>
    </section>
  )
}
