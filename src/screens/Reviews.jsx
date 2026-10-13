import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'

export default function Reviews() {
  const { locale, texts } = useLanguage()
  
  const [reviewsList, setReviewsList] = useState([])
  const [visibleCount, setVisibleCount] = useState(3)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAllReviews() {
      try {
        const response = await api.get('/api/reviews/all')
        const rawReviews = response.data

        const enrichedReviews = await Promise.all(
          rawReviews.map(async (review) => {
            const itemType = review.type === 'tv' ? 'tv' : 'movie'
            const endpoint = itemType === 'tv' ? `/api/tv/${review.movie_id}` : `/api/movies/${review.movie_id}`

            try {
              const movieRes = await api.get(endpoint, {
                params: { language: locale },
              })
              return {
                ...review,
                itemType,
                posterUrl: movieRes.data.posterUrl || movieRes.data.poster_path || '',
                movieTitle: movieRes.data.title || movieRes.data.name || review.movie_title
              }
            } catch {
              return { ...review, itemType, posterUrl: '', movieTitle: review.movie_title }
            }
          })
        )

        setReviewsList(enrichedReviews)
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

  const visibleReviews = reviewsList.slice(0, visibleCount)

  return (
    <section className="reviews-page" aria-labelledby="reviews-title">
      <header className="page-heading">
        <h1 id="reviews-title">{texts.reviews}</h1>
      </header>

      {reviewsList.length === 0 ? (
        <p className="status-message">{texts.noComments || 'Ei vielä yhtään arvostelua.'}</p>
      ) : (
        <section className="panel reviews-list-section" aria-labelledby="list-title">
          <div className="reviews-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {visibleReviews.map((review) => {
              // Varmistetaan, että tyyppi ohjautuu oikeaan osoitteeseen (/tv/id tai /movie/id)
              const mediaType = review.type === 'tv' ? 'tv' : 'movie'
              const detailPath = `/${mediaType}/${review.movie_id}`

              return (
                <article 
                  key={review.id} 
                  className="review-card" 
                  style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px' }}
                >
                  <Link to={detailPath} style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
                    {review.posterUrl ? (
                      <img 
                        src={review.posterUrl} 
                        alt={review.movieTitle} 
                        style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '4px' }} 
                      />
                    ) : (
                      <div style={{ width: '80px', height: '120px', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', textAlign: 'center', borderRadius: '4px' }}>
                        {texts.posterMissing}
                      </div>
                    )}
                  </Link>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0' }}>
                      <Link to={detailPath} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {review.movieTitle}
                      </Link>
                    </h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                      {texts.owner ? 'Arvostellut:' : 'Reviewed by:'} <strong>{review.username || 'Tuntematon'}</strong>
                    </p>
                    <p className="review-card-stars" aria-hidden="true" style={{ margin: '0 0 8px 0' }}>
                      {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)} ({review.stars}/5)
                    </p>
                    <p className="review-card-text" style={{ margin: '0 0 8px 0' }}>"{review.review_text}"</p>
                    <small>{new Date(review.created_at).toLocaleDateString(locale)}</small>
                  </div>
                </article>
              )
            })}
          </div>

          {visibleCount < reviewsList.length && (
            <button 
              className="button secondary-button" 
              onClick={() => setVisibleCount((prev) => prev + 3)}
              style={{ marginTop: '20px' }}
            >
              {texts.more}
            </button>
          )}
        </section>
      )}
    </section>
  )
}