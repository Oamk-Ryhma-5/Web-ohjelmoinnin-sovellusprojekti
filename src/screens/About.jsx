import { Link } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage.js'

export default function About() {
  const { texts } = useLanguage()
  return (
    <section className="small-page panel">
      <h1>{texts.aboutTitle}</h1>
      <p>{texts.aboutText}</p>
      <p>{texts.aboutData}</p>
      <div className="attribution">
        <img src="/tmdb-logo.svg" width="130" height="24" alt="TMDB" />
        <p lang="en">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
      <Link className="button" to="/">
        {texts.backHome}
      </Link>
    </section>
  )
}
