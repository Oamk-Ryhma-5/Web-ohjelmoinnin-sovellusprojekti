import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'

export default function Reviews() {
  const { locale, texts } = useLanguage()
  
  const [groupedReviews, setGroupedReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Haetaan kaikki arvostelut ja ryhmitellään ne elokuvan/sarjan ID:n mukaan
  useEffect(() => {
    async function loadAllReviews() {
      try {
        const response = await api.get('/api/reviews/all')
        const rawReviews = response.data

        const groupsMap = {}

        for (const review of rawReviews) {
          const key = review.movie_id
          if (!groupsMap[key]) {
            const itemType = review.type === 'tv' ? 'tv' : 'movie'
            groupsMap[key] = {
              movieId: review.movie_id,
              movieTitle: review.movie_title,
              itemType,
              posterUrl: '',
              reviews: []
            }
          }
          groupsMap[key].reviews.push(review)
        }

        const groupsArray = Object.values(groupsMap)

        // Haetaan puuttuvat julisteet ja otsikot TMDB:stä / omasta API:sta
        const enrichedGroups = await Promise.all(
          groupsArray.map(async (group) => {
            const endpoint = group.itemType === 'tv' ? `/api/tv/${group.movieId}` : `/api/movies/${group.movieId}`
            try {
              const movieRes = await api.get(endpoint, {
                params: { language: locale },
              })
              return {
                ...group,
                posterUrl: movieRes.data.posterUrl || movieRes.data.poster_path || '',
                movieTitle: movieRes.data.title || movieRes.data.name || group.movieTitle
              }
            } catch {
              return group
            }
          })
        )

        setGroupedReviews(enrichedGroups)
      } catch (err) {
        console.error('Kaikkien arvostelujen lataus epäonnistui:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAllReviews()
  }, [locale])

  if (loading) {
    return <p>{texts.loading}</p>
  }

  return (
    <section className="reviews-page" aria-labelledby="reviews-title">
      <header className="page-heading">
        <h1 id="reviews-title">{texts.reviews}</h1>
      </header>

      {groupedReviews.length === 0 ? (
        <p className="status-message">{texts.noComments || 'Ei vielä yhtään arvostelua.'}</p>
      ) : (
        <section className="panel reviews-list-section" aria-labelledby="list-title">
          <div className="reviews-container">
            {groupedReviews.map((group) => {
              const detailPath = `/${group.itemType}/${group.movieId}`

              return (
                <article 
                  key={group.movieId} 
                  className="panel review-group-card"
                >
                  {/* Elokuvan / Sarjan yhteistiedot ja posteri */}
                  <div className="review-group-header">
                    <Link to={detailPath} className="review-poster-link">
                      {group.posterUrl ? (
                        <img 
                          src={group.posterUrl} 
                          alt={group.movieTitle} 
                          className="review-poster-img"
                        />
                      ) : (
                        <div className="review-poster-missing">
                          {texts.posterMissing}
                        </div>
                      )}
                    </Link>

                    <div>
                      <h3 className="review-movie-title">
                        <Link to={detailPath} className="review-title-link">
                          {group.movieTitle}
                        </Link>
                      </h3>
                      <p className="review-count-text">
                        Arvosteluja yhteensä: {group.reviews.length}
                      </p>
                    </div>
                  </div>

                  {/* Kyseisen kohteen kaikki käyttäjien arvostelut listattuna */}
                  <div className="reviews-sublist">
                    {group.reviews.map((review) => (
                      <div key={review.id} className="review-item-box">
                        <p className="review-item-meta">
                          <strong>{review.username || 'Tuntematon'}</strong>{' '}
                          <span aria-hidden="true" className="review-stars-span">
                            {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                          </span> ({review.stars}/5)
                        </p>
                        <p className="review-item-text">"{review.review_text}"</p>
                        <small className="review-item-date">{new Date(review.created_at).toLocaleDateString(locale)}</small>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </section>
  )
}