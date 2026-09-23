import { useEffect, useState } from 'react'
import { useAuth } from '../auth/context.js'
import { useI18n } from '../i18n/context.js'
import { useCatalog } from '../hooks/useCatalog.js'
import { navigate } from '../navigation.js'
import Link from './Link.jsx'
import Icon from './Icon.jsx'
import PasswordField from './PasswordField.jsx'

export default function AuthPage({ mode }) {
  const register = mode === 'register'
  const { user, authenticate } = useAuth()
  const { t, errorText } = useI18n()
  const catalog = useCatalog('/api/movies/now-playing')
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [mismatch, setMismatch] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (user) navigate('/omat-tiedot', { replace: true }) }, [user])

  function change(event) {
    setForm(previous => ({ ...previous, [event.target.name]: event.target.value }))
    setError(null); setMismatch(false)
  }
  async function submit(event) {
    event.preventDefault()
    if (register && form.password !== form.confirm) { setMismatch(true); return }
    setError(null); setBusy(true)
    try { await authenticate(mode, { username: form.username, email: form.email, password: form.password }) }
    catch (failure) { setError(failure) }
    finally { setBusy(false) }
  }

  return <div className="auth-layout">
    <aside className="auth-art" aria-hidden="true"><div className="poster-mosaic">{catalog.items.filter(item => item.posterUrl).slice(0, 6).map(item => <img key={item.id} src={item.posterUrl} alt="" onError={event => { event.currentTarget.style.visibility = 'hidden' }} />)}</div><div className="auth-art-shade" />
      <div className="auth-art-top"><span className="brand-symbol"><Icon name="film" size={24} /></span><span>LEFFAHAKU</span></div>
      <div className="auth-art-copy"><p className="eyebrow">{t('authEyebrow')}</p><h2>{t('authTitleFirst')}<br /><span>{t('authTitleLast')}</span></h2><p>{t('authCopy')}</p><span className="art-line" /></div>
    </aside>
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-tabs"><Link to="/kirjaudu" aria-current={!register ? 'page' : undefined}>{t('login')}</Link><Link to="/rekisteroidy" aria-current={register ? 'page' : undefined}>{t('register')}</Link></div>
      <div className="auth-heading"><h1 id="auth-title">{t(register ? 'registerTitle' : 'loginTitle')}</h1><p>{t(register ? 'registerCopy' : 'loginCopy')}</p></div>
      <form className="auth-form" onSubmit={submit} aria-busy={busy}>
        {register && <div className="field"><label htmlFor="auth-username">{t('username')}</label><input id="auth-username" name="username" autoComplete="username" required minLength={3} maxLength={30} placeholder={t('usernamePlaceholder')} value={form.username} onChange={change} aria-describedby="username-hint" /><p id="username-hint" className="field-hint">{t('usernameHint')}</p></div>}
        <div className="field"><label htmlFor="auth-email">{t('email')}</label><input id="auth-email" type="email" name="email" autoComplete={register ? 'email' : 'username'} maxLength={254} required placeholder={t('emailPlaceholder')} value={form.email} onChange={change} /></div>
        <PasswordField id="auth-password" label={t('password')} name="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 12 : 1} value={form.password} onChange={change} hint={register ? t('passwordHint') : undefined} />
        {register && <PasswordField id="auth-confirm" label={t('confirmPassword')} name="confirm" autoComplete="new-password" minLength={12} value={form.confirm} onChange={change} />}
        {(error || mismatch) && <p className="form-error" role="alert">{mismatch ? t('passwordMismatch') : errorText(error)}</p>}
        <button className="button primary full-width" type="submit" disabled={busy}>{t(busy ? register ? 'creatingAccount' : 'signingIn' : register ? 'registerAction' : 'loginAction')}<Icon name="arrow" size={18} /></button>
      </form>
      <p className="auth-alternative">{t(register ? 'haveAccount' : 'noAccount')} <Link to={register ? '/kirjaudu' : '/rekisteroidy'}>{t(register ? 'login' : 'register')}</Link></p>
      <Link className="back-link" to="/"><Icon name="arrow" size={16} />{t('backToMovies')}</Link>
    </section>
  </div>
}
