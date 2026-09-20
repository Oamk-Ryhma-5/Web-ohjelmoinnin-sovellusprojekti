import { useState } from 'react'
import { useCatalog, useGenres } from '../hooks/useCatalog.js'
import { useI18n } from '../i18n/context.js'
import CatalogResults from './CatalogResults.jsx'
import Icon from './Icon.jsx'

const INITIAL_FILTERS = { type: 'movie', query: '', year: '', genre: '' }

function makeSearch(filters, revision = 1) {
  const parameters = new URLSearchParams({ type: filters.type })
  for (const name of ['query', 'year', 'genre']) if (filters[name].trim()) parameters.set(name, filters[name].trim())
  return { path: `/api/search?${parameters}`, filters: { ...filters }, revision }
}

export default function Search({ initialQuery = '' }) {
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS, query: initialQuery })
  const [search, setSearch] = useState(() => initialQuery.trim() ? makeSearch({ ...INITIAL_FILTERS, query: initialQuery }) : null)
  const [formError, setFormError] = useState(false)
  const { t, errorText } = useI18n()
  const genreData = useGenres(filters.type)
  const resultGenres = useGenres(search?.filters.type || 'movie')
  const catalog = useCatalog(search?.path, search?.revision)

  function change(event) {
    const { name, value } = event.target
    setFormError(false)
    setFilters(previous => ({ ...previous, [name]: value, ...(name === 'type' ? { genre: '' } : {}) }))
  }
  function submit(event) {
    event.preventDefault()
    if (!filters.query.trim() && !filters.year && !filters.genre) return setFormError(true)
    setSearch(previous => makeSearch(filters, (previous?.revision || 0) + 1))
    setFormError(false)
  }
  function clear() { setFilters(INITIAL_FILTERS); setSearch(null); setFormError(false) }

  return <section aria-labelledby="search-title" className="search-page">
    <div className="page-heading"><p className="eyebrow">{t('searchEyebrow')}</p><h1 id="search-title">{t('searchTitle')}</h1><p>{t('searchCopy')}</p></div>
    <form className="search-form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field"><label htmlFor="search-type">{t('content')}</label><select id="search-type" name="type" value={filters.type} onChange={change}><option value="movie">{t('movies')}</option><option value="tv">{t('tvShows')}</option></select></div>
        <div className="field title-field"><label htmlFor="search-name">{t('title')}</label><input id="search-name" type="search" name="query" placeholder={t('titlePlaceholder')} maxLength={200} value={filters.query} onChange={change} /></div>
        <div className="field"><label htmlFor="search-year">{t(filters.type === 'movie' ? 'releaseYear' : 'firstYear')}</label><input id="search-year" type="number" name="year" placeholder={t('yearPlaceholder')} min={1800} max={new Date().getFullYear() + 5} step={1} value={filters.year} onChange={change} /></div>
        <div className="field"><label htmlFor="search-genre">{t('genre')}</label><select id="search-genre" name="genre" value={filters.genre} onChange={change} disabled={genreData.loading || Boolean(genreData.error)}><option value="">{t(genreData.loading ? 'loading' : 'allGenres')}</option>{genreData.genres.map(genre => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select></div>
      </div>
      {genreData.error && <div className="form-error" role="alert">{errorText(genreData.error)} <button type="button" className="text-button" onClick={genreData.retry}>{t('retry')}</button></div>}
      {formError && <p className="form-error" role="alert">{t('error.EMPTY_SEARCH')}</p>}
      <div className="form-actions"><button type="submit" className="button primary"><Icon name="search" size={18} />{t('submitSearch')}</button><button type="button" className="button subtle" onClick={clear}>{t('clear')}</button></div>
    </form>
    {search ? <><div className="section-line results-heading"><h2>{t('searchResults')}</h2><span className="search-summary">{[t(search.filters.type === 'movie' ? 'movies' : 'tvShows'), search.filters.query, search.filters.year, resultGenres.genres.find(genre => genre.id === Number(search.filters.genre))?.name].filter(Boolean).join(' · ')}</span></div><CatalogResults catalog={catalog} genres={resultGenres.genres} /></> :
      <div className="search-intro"><span className="empty-icon"><Icon name="search" size={28} /></span><h2>{t('startSearch')}</h2><p>{t('startSearchCopy')}</p></div>}
  </section>
}
