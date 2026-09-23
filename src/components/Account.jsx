import { useEffect, useState } from 'react'
import { useAuth } from '../auth/context.js'
import { useI18n } from '../i18n/context.js'
import { navigate } from '../navigation.js'
import Link from './Link.jsx'
import Icon from './Icon.jsx'
import PasswordField from './PasswordField.jsx'

function AccountDetails({ user }) {
  const { updateProfile, authenticate, logout, refresh } = useAuth()
  const { t, locale, errorText } = useI18n()
  const [username, setUsername] = useState(user.username)
  const [passwords, setPasswords] = useState({ currentPassword: '', password: '', confirm: '' })
  const [profileStatus, setProfileStatus] = useState({})
  const [passwordStatus, setPasswordStatus] = useState({})
  const [logoutStatus, setLogoutStatus] = useState({})
  useEffect(() => { setUsername(user.username) }, [user.username])

  function failureState(error) {
    if (error.status === 401) refresh()
    return { error }
  }
  async function saveProfile(event) {
    event.preventDefault(); setProfileStatus({ busy: true })
    try { await updateProfile(username); setProfileStatus({ success: true }) }
    catch (error) { setProfileStatus(failureState(error)) }
  }
  async function savePassword(event) {
    event.preventDefault()
    if (passwords.password !== passwords.confirm) return setPasswordStatus({ mismatch: true })
    setPasswordStatus({ busy: true })
    try {
      await authenticate('password', { currentPassword: passwords.currentPassword, password: passwords.password })
      setPasswords({ currentPassword: '', password: '', confirm: '' }); setPasswordStatus({ success: true })
    } catch (error) { setPasswordStatus(failureState(error)) }
  }
  async function signOut() {
    setLogoutStatus({ busy: true })
    try { await logout(); navigate('/', { replace: true }) }
    catch (error) { setLogoutStatus({ error }) }
  }
  const joined = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(user.createdAt))

  return <section className="account-page" aria-labelledby="account-title">
    <div className="account-welcome"><div><p className="eyebrow">{t('yourSpace')}</p><h1 id="account-title">{t('welcome', { name: user.username })}</h1><p>{t('accountCopy')}</p></div><span className="avatar large">{user.username.slice(0, 1).toUpperCase()}</span></div>
    <div className="account-layout">
      <aside className="account-sidebar"><div className="member-card"><span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span><h2>{user.username}</h2><p>{user.email}</p><span className="member-since">{t('memberSince', { date: joined })}</span><button className="button secondary full-width" disabled={logoutStatus.busy} onClick={signOut}><Icon name="logout" size={18} />{t('logout')}</button>{logoutStatus.error && <p className="form-error" role="alert">{errorText(logoutStatus.error)}</p>}</div>
        <Link className="discover-card" to="/haku"><Icon name="film" size={26} /><h3>{t('readyTitle')}</h3><p>{t('readyCopy')}</p><span>{t('explore')}<Icon name="arrow" size={18} /></span></Link>
      </aside>
      <div className="account-forms"><section className="settings-card"><div className="settings-heading"><span className="settings-icon"><Icon name="user" /></span><div><h2>{t('profile')}</h2><p>{t('profileCopy')}</p></div></div>
        <form onSubmit={saveProfile}><div className="field"><label htmlFor="profile-username">{t('username')}</label><input id="profile-username" name="username" autoComplete="username" required minLength={3} maxLength={30} value={username} onChange={event => { setUsername(event.target.value); setProfileStatus({}) }} /><p className="field-hint">{t('usernameHint')}</p></div><div className="field"><label htmlFor="profile-email">{t('email')}</label><input id="profile-email" value={user.email} readOnly autoComplete="email" /></div>
          {profileStatus.error && <p className="form-error" role="alert">{errorText(profileStatus.error)}</p>}{profileStatus.success && <p className="success" role="status"><Icon name="check" size={17} />{t('saved')}</p>}
          <button className="button primary" disabled={profileStatus.busy}>{t(profileStatus.busy ? 'saving' : 'saveProfile')}</button>
        </form>
      </section>
      <section className="settings-card"><div className="settings-heading"><span className="settings-icon"><Icon name="lock" /></span><div><h2>{t('changePassword')}</h2><p>{t('securityCopy')}</p></div></div>
        <form onSubmit={savePassword}>
          <PasswordField id="current-password" label={t('currentPassword')} autoComplete="current-password" value={passwords.currentPassword} onChange={event => { setPasswords(previous => ({ ...previous, currentPassword: event.target.value })); setPasswordStatus({}) }} />
          <div className="password-grid"><PasswordField id="new-password" label={t('newPassword')} hint={t('passwordHint')} minLength={12} autoComplete="new-password" value={passwords.password} onChange={event => { setPasswords(previous => ({ ...previous, password: event.target.value })); setPasswordStatus({}) }} /><PasswordField id="confirm-password" label={t('confirmPassword')} autoComplete="new-password" minLength={12} value={passwords.confirm} onChange={event => { setPasswords(previous => ({ ...previous, confirm: event.target.value })); setPasswordStatus({}) }} /></div>
          {(passwordStatus.error || passwordStatus.mismatch) && <p className="form-error" role="alert">{passwordStatus.mismatch ? t('passwordMismatch') : errorText(passwordStatus.error)}</p>}{passwordStatus.success && <p className="success" role="status"><Icon name="check" size={17} />{t('passwordChanged')}</p>}
          <button className="button secondary" disabled={passwordStatus.busy}>{t(passwordStatus.busy ? 'saving' : 'changePassword')}</button>
        </form>
      </section></div>
    </div>
  </section>
}

export default function Account() {
  const { user, loading, error, refresh } = useAuth()
  const { t } = useI18n()
  useEffect(() => { if (!loading && !error && !user) navigate('/kirjaudu', { replace: true }) }, [loading, error, user])
  if (loading) return <div className="empty-page" role="status">{t('loading')}</div>
  if (error) return <div className="message error" role="alert"><p>{t('sessionError')}</p><button className="button secondary" onClick={refresh}>{t('retry')}</button></div>
  return user ? <AccountDetails key={user.id} user={user} /> : null
}
