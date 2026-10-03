import { Link, NavLink } from 'react-router-dom'
import { useUser } from '../context/useUser.js'
import { useLanguage } from '../context/useLanguage.js'
import ThemeSelect from './ThemeSelect.jsx'

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
          <NavLink to="/groups">{texts.groups}</NavLink>
          {/* Näytetään suosikit navigaatiossa vain kirjautuneelle käyttäjälle */}
          {user && (
            <NavLink to="/suosikit">
              {texts.favorites || 'Suosikit'}
            </NavLink>
          )}
        </nav>
        
        <div className="header-actions">
          {/* Kielivalinta alasvetovalikkona */}
          <div className="language-select-wrapper">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={texts.language || 'Kieli'}
              className="language-select"
            >
              <option value="fi">FI</option>
              <option value="en">EN</option>
              <option value="sv">SV</option>
              <option value="tlh">TLH</option>
            </select>
          </div>

          <ThemeSelect />
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