import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage.js'
import MovieList from '../components/MovieList.jsx'

export default function Home() {
  const { texts, language } = useLanguage()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function search(event) {
    event.preventDefault()
    navigate(`/haku?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      <section className="home-search" aria-labelledby="home-title">
        <h1 id="home-title">{texts.homeTitle}</h1>
        <form className="quick-search" onSubmit={search}>
          <div className="quick-search-field">
            <label htmlFor="quick-search">{texts.quickSearch}</label>
            <input
              id="quick-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={texts.searchPlaceholder}
              maxLength={200}
            />
          </div>
          <button className="button" type="submit">
            {texts.searchButton}
          </button>
        </form>
      </section>
      <section className="catalog-section" aria-labelledby="now-playing-title">
        <div className="section-heading">
          <h2 id="now-playing-title">{texts.nowPlaying}</h2>
          <Link className="text-link" to="/haku">
            {texts.browseSearch}
          </Link>
        </div>
        <MovieList key={language} url="/api/movies/now-playing" />
      </section>
    </>
  )
}
