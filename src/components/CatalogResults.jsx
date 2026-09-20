import { useState } from 'react'
import { useI18n } from '../i18n/context.js'
import Icon from './Icon.jsx'

function MovieCard({ item, genres }) {
  const [imageFailed, setImageFailed] = useState(false)
  const { t } = useI18n()
  const genreNames = item.genreIds.map(id => genres.find(genre => genre.id === id)?.name).filter(Boolean)
  return <article className="movie-card">
    <a className="poster" href={item.tmdbUrl} target="_blank" rel="noreferrer" aria-label={`${item.title} · ${t('external')}`}>
      {item.posterUrl && !imageFailed ? <img src={item.posterUrl} alt="" loading="lazy" width="500" height="750" onError={() => setImageFailed(true)} /> :
        <div className="poster-placeholder"><Icon name="film" size={40} /><span>{item.title}</span></div>}
      <span className="type-badge">{t(item.type === 'movie' ? 'movie' : 'series')}</span>
      {item.rating > 0 && <span className="rating-badge" aria-label={`${t('rating')}: ${item.rating} / 10`}><Icon name="star" size={12} />{item.rating.toFixed(1)}</span>}
      <span className="poster-open"><Icon name="arrow" size={23} /></span>
    </a>
    <div className="movie-content"><div className="movie-meta"><span>{item.year}</span><span>{genreNames.slice(0, 2).join(' / ')}</span></div>
      <h3><a href={item.tmdbUrl} target="_blank" rel="noreferrer">{item.title}<span className="sr-only"> · {t('external')}</span></a></h3>
      {item.overview && <p className="movie-overview">{item.overview}</p>}
    </div>
  </article>
}

export default function CatalogResults({ catalog, genres = [], emptyText }) {
  const { items, loading, error, nextPage } = catalog
  const { t, errorText } = useI18n()
  return <div className="catalog-results" aria-busy={loading}>
    <div className="results-status" role="status" aria-live="polite">{loading ? t('loading') : items.length ? t(items.length === 1 ? 'oneResult' : 'results', { count: items.length }) : ''}</div>
    {error && <div className="message error" role="alert"><p>{errorText(error)}</p><button className="button secondary" onClick={catalog.retry}>{t('retry')}</button></div>}
    {loading && items.length === 0 && <div className="movie-grid" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <div className="skeleton-card" key={i}><div /><span /><span /></div>)}</div>}
    {!loading && !error && items.length === 0 && <div className="message empty"><Icon name="search" size={32} /><h3>{t(nextPage ? 'morePossible' : 'noResults')}</h3><p>{nextPage ? t('moreHint') : emptyText || t('noMatches')}</p></div>}
    <div className="movie-grid">{items.map(item => <MovieCard key={`${item.type}-${item.id}`} item={item} genres={genres} />)}</div>
    {nextPage && !error && <div className="load-more"><button className="button secondary" disabled={loading} onClick={catalog.loadMore}>{t(loading ? 'loading' : items.length ? 'more' : 'continueSearch')}<Icon name="arrow" size={17} /></button></div>}
    {catalog.limitReached && <p className="muted">{t('refine')}</p>}
  </div>
}
