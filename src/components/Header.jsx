import { Link, NavLink } from 'react-router-dom'
import { useUser } from '../context/useUser.js'
import { useLanguage } from '../context/useLanguage.js'

export default function Header() {
  const { user, loading } = useUser()
  const { language, setLanguage, texts } = useLanguage()

  return (
    <header className="site-header">
      <div className="header-content">
        <Link className="site-name" to="/">
          Leffahaku
        </Link>
        <nav className="main-nav" aria-label={texts.navigation}>
          <NavLink to="/" end>
            {texts.theaters}
          </NavLink>
          <NavLink to="/haku">{texts.search}</NavLink>
        </nav>
        <div className="header-actions">
          <div className="language-buttons" role="group" aria-label={texts.language}>
            <button
              lang="fi"
              aria-label="Suomi"
              aria-pressed={language === 'fi'}
              onClick={() => setLanguage('fi')}
            >
              FI
            </button>
            <button
              lang="en"
              aria-label="English"
              aria-pressed={language === 'en'}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button
              lang="sv"
              aria-label="Svenska"
              aria-pressed={language === 'sv'}
              onClick={() => setLanguage('sv')}
            >
              SV
            </button>
            <button
              lang="tlh"
              aria-label="tlhIngan Hol"
              aria-pressed={language === 'tlh'}
              onClick={() => setLanguage('tlh')}
            >
              TLH
            </button>
          </div>
          {!loading &&
            (user ? (
              <NavLink
                className="account-link"
                to="/omat-tiedot"
                aria-label={`${texts.account}: ${user.username}`}
              >
                <span className="account-name">{user.username}</span>
              </NavLink>
            ) : (
              <Link className="button small" to="/kirjaudu">
                {texts.signIn}
              </Link>
            ))}
        </div>
      </div>
    </header>
  )
}