import { useEffect } from 'react'
import NowPlaying from './components/NowPlaying.jsx'
import Search from './components/Search.jsx'
import AuthPage from './components/AuthPage.jsx'
import Account from './components/Account.jsx'
import Icon from './components/Icon.jsx'
import Link from './components/Link.jsx'
import { useAuth } from './auth/context.js'
import { useI18n } from './i18n/context.js'
import { useLocation } from './navigation.js'
import './catalog.css'

export default function App() {
  const location = useLocation()
  const path = location.split('?')[0]
  const { user, loading } = useAuth()
  const { language, setLanguage, t } = useI18n()
  const authPage = path === '/kirjaudu' || path === '/rekisteroidy'
  useEffect(() => {
    const name = { '/': 'theaters', '/haku': 'search', '/kirjaudu': 'login', '/rekisteroidy': 'register', '/omat-tiedot': 'account', '/tietoa': 'about' }[path]
    document.title = `Leffahaku · ${t(name || 'notFound')}`
  }, [path, t])
  useEffect(() => { document.getElementById('main')?.focus({ preventScroll: true }) }, [path])

  let content
  if (path === '/') content = <NowPlaying />
  else if (path === '/haku') content = <Search key={location} initialQuery={new URLSearchParams(location.split('?')[1]).get('q') || ''} />
  else if (authPage) content = <AuthPage key={path} mode={path === '/kirjaudu' ? 'login' : 'register'} />
  else if (path === '/omat-tiedot') content = <Account />
  else if (path === '/tietoa') content = <section className="about-panel">
    <span className="brand-symbol large"><Icon name="film" size={32} /></span>
    <p className="eyebrow">LEFFAHAKU</p><h1>{t('aboutTitle')}</h1><p>{t('aboutCopy')}</p>
    <div className="attribution-panel"><a href="https://www.themoviedb.org" target="_blank" rel="noreferrer"><img src="/tmdb-logo.svg" width="130" height="18" alt="TMDB" /></a>
      <p>{t('aboutData')}</p><p lang="en">This product uses the TMDB API but is not endorsed or certified by TMDB.</p></div>
    <Link className="button primary" to="/">{t('backToMovies')}<Icon name="arrow" /></Link>
  </section>
  else content = <section className="empty-page"><p className="eyebrow">404</p><h1>{t('notFound')}</h1><p>{t('notFoundCopy')}</p><Link className="button primary" to="/">{t('home')}<Icon name="arrow" /></Link></section>

  return <div className="app-shell">
    <a className="skip-link" href="#main">{t('skip')}</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" to="/" aria-label={`Leffahaku · ${t('home')}`}><span className="brand-symbol"><Icon name="film" size={23} /></span><span>leffahaku<span className="brand-dot">.</span></span></Link>
      <nav className="main-nav" aria-label={t('navigation')}>
        <Link to="/" aria-current={path === '/' ? 'page' : undefined}>{t('theaters')}</Link>
        <Link to="/haku" aria-current={path === '/haku' ? 'page' : undefined}><Icon name="search" size={16} />{t('search')}</Link>
      </nav>
      <div className="header-tools">
        <div className="language-switch" role="group" aria-label={t('language')}>
          <button lang="fi" aria-label="Suomi" aria-pressed={language === 'fi'} onClick={() => setLanguage('fi')}>FI</button>
          <button lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
        </div>
        {loading ? <span className="account-loading" aria-label={t('loading')} /> : user ?
          <Link to="/omat-tiedot" className="account-link" aria-label={`${t('account')}: ${user.username}`} aria-current={path === '/omat-tiedot' ? 'page' : undefined}><span className="avatar small">{user.username.slice(0, 1).toUpperCase()}</span><span>{user.username}</span></Link> :
          <><Link className="login-link" to="/kirjaudu" aria-current={path === '/kirjaudu' ? 'page' : undefined}>{t('login')}</Link><Link className="button primary join-button" to="/rekisteroidy">{t('register')}<Icon name="arrow" size={16} /></Link></>}
      </div>
    </div></header>
    <main id="main" tabIndex={-1} className={`main-content${authPage ? ' auth-main' : ''}`}>{content}</main>
    <footer className="site-footer"><div className="footer-inner">
      <Link className="footer-brand" to="/">leffahaku<span>.</span></Link>
      <div className="footer-links"><Link to="/tietoa">{t('about')}</Link><a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label="The Movie Database"><img className="tmdb-logo" src="/tmdb-logo.svg" width="90" height="13" alt="TMDB" /></a></div>
    </div></footer>
  </div>
}
