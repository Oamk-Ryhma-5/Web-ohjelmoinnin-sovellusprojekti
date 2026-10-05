import { useLanguage } from '../context/useLanguage.js'
import { Link } from 'react-router-dom'

export default function MovieCard({ movie, genres }) {
  const { texts, locale } = useLanguage()
  const genreNames = genres
    .filter((genre) => movie.genreIds.includes(genre.id))
    .map((genre) => genre.name)

  return (
    <article className="movie-card">
        <Link
          className="poster-link"
          to={`/movie/${movie.id}`}
          aria-label={movie.title}
        >
        {movie.posterUrl ? (
          <img className="poster" src={movie.posterUrl} alt={movie.title} loading="lazy" />
        ) : (
          <div className="poster missing-poster">{texts.posterMissing}</div>
        )}
        {movie.rating !== null && (
          <span className="movie-rating" aria-label={`${texts.rating}: ${movie.rating.toFixed(1)}`}>
            <span aria-hidden="true">★ </span>
            {movie.rating.toLocaleString(locale, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            })}
          </span>
        )}
      </Link>
      <div className="movie-info">
        <p className="movie-meta">
          {movie.year} <span>·</span> {texts[movie.type]}
        </p>
        <h3>
          <Link to={`/movie/${movie.id}`}>
            {movie.title || texts.titleMissing}
          </Link>
        </h3>
        <p className="movie-genres">{genreNames.slice(0, 2).join(' · ')}</p>
      </div>
    </article>
  )
}
