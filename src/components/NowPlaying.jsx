import { useState } from 'react'
import { useCatalog, useGenres } from '../hooks/useCatalog.js'
import { useI18n } from '../i18n/context.js'
import { navigate } from '../navigation.js'
import CatalogResults from './CatalogResults.jsx'
import Icon from './Icon.jsx'

export default function NowPlaying() {
  const catalog = useCatalog('/api/movies/now-playing')
  const { genres } = useGenres('movie')
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const featured = catalog.items.find(item => item.backdropUrl) || catalog.items[0]
  return <>
    <section className="cinema-hero" aria-labelledby="hero-title">
      {featured?.backdropUrl && <img key={featured.backdropUrl} className="hero-image" src={featured.backdropUrl} alt="" onError={event => { event.currentTarget.style.opacity = 0 }} />}
      <div className="hero-shade" />
      <div className="hero-content"><p className="eyebrow"><span className="live-dot" />{t('eyebrow')}</p>
        <h1 id="hero-title">{t('heroFirst')}<br /><span>{t('heroAccent')}</span></h1><p className="hero-copy">{t('heroCopy')}</p>
        <form className="hero-search" onSubmit={event => { event.preventDefault(); navigate(query.trim() ? `/haku?q=${encodeURIComponent(query.trim())}` : '/haku') }}>
          <Icon name="search" /><label className="sr-only" htmlFor="hero-query">{t('heroSearch')}</label><input id="hero-query" type="search" maxLength={200} placeholder={t('heroSearch')} value={query} onChange={event => setQuery(event.target.value)} />
          <button aria-label={t('explore')}><Icon name="arrow" /></button>
        </form>
      </div>
      {featured && <a className="hero-feature" href={featured.tmdbUrl} target="_blank" rel="noreferrer"><span>{t('featured')}</span><strong>{featured.title}</strong><Icon name="arrow" size={18} /><span className="sr-only">{t('external')}</span></a>}
    </section>
    <section className="now-playing" aria-labelledby="now-playing-title">
      <div className="section-line"><div><p className="eyebrow">{t('featured')}</p><h2 id="now-playing-title">{t('nowPlaying')}</h2><p>{t('program')}</p></div><span className="region-badge"><span className="live-dot" />{t('finland')}</span></div>
      <CatalogResults catalog={catalog} genres={genres} emptyText={t('noMovies')} />
    </section>
  </>
}
