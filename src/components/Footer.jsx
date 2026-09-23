import { Link } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage.js'

export default function Footer() {
  const { texts } = useLanguage()
  return (
    <footer className="site-footer">
      <Link to="/">Leffahaku</Link>
      <div>
        <Link to="/tietoa">{texts.about}</Link>
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
          TMDB
        </a>
      </div>
    </footer>
  )
}
