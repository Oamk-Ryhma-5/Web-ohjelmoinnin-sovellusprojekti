import { useState } from 'react'
import { api, errorMessage } from '../api.js'
import { useUser } from '../context/useUser.js'
import { useLanguage } from '../context/useLanguage.js'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Account() {
  const { user, setUser, signOut } = useUser()
  const { texts, locale } = useLanguage()
  const [username, setUsername] = useState(user.username)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function showError(error) {
    if (error.response?.status === 401) setUser(null)
    else setError(error)
  }

  async function saveUsername(event) {
    event.preventDefault()
    setError(null)
    setSuccess('')
    setSaving(true)
    try {
      const response = await api.patch('/api/auth/profile', { username })
      setUser(response.data.user)
      setSuccess('saved')
    } catch (error) {
      showError(error)
    } finally {
      setSaving(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setError(null)
    setSuccess('')
    if (password !== confirmation) {
      setError({ code: 'PASSWORD_MISMATCH' })
      return
    }
    setSaving(true)
    try {
      const response = await api.post('/api/auth/password', { currentPassword, password })
      setUser(response.data.user)
      setCurrentPassword('')
      setPassword('')
      setConfirmation('')
      setSuccess('passwordChanged')
    } catch (error) {
      showError(error)
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    setError(null)
    setSaving(true)
    try {
      await signOut()
    } catch (error) {
      showError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-section account-page">
      <div className="page-heading">
        <h1>{texts.accountTitle}</h1>
        <p>{texts.accountText}</p>
      </div>
      <div className="account-summary panel">
        <div>
          <h2>{user.username}</h2>
          <p>
            {texts.joined} {new Date(user.createdAt).toLocaleDateString(locale)}
          </p>
        </div>
        <button className="button secondary" onClick={logout} disabled={saving}>
          {texts.signOut}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {errorMessage(error, texts)}
        </p>
      )}
      {success && (
        <p className="form-success" role="status">
          {texts[success]}
        </p>
      )}
      <div className="account-forms">
        <form className="panel" onSubmit={saveUsername}>
          <h2>{texts.profile}</h2>
          <div className="form-field">
            <label htmlFor="account-name">{texts.username}</label>
            <input
              id="account-name"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
            />
            <small>{texts.usernameHelp}</small>
          </div>
          <div className="form-field">
            <label htmlFor="account-email">{texts.email}</label>
            <input id="account-email" type="email" value={user.email} readOnly />
            <small>{texts.emailHelp}</small>
          </div>
          <button className="button" type="submit" disabled={saving}>
            {texts.save}
          </button>
        </form>
        <form className="panel" onSubmit={savePassword}>
          <h2>{texts.passwordTitle}</h2>
          <PasswordInput
            id="current-password"
            label={texts.currentPassword}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />
          <PasswordInput
            id="new-password"
            label={texts.newPassword}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
          />
          <p className="field-help">{texts.passwordHelp}</p>
          <PasswordInput
            id="new-password-confirmation"
            label={texts.passwordAgain}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={8}
          />
          <button className="button" type="submit" disabled={saving}>
            {texts.changePassword}
          </button>
        </form>
      </div>
    </section>
  )
}
