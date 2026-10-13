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
          <div className="reviews-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {groupedReviews.map((group) => {
              const detailPath = `/${group.itemType}/${group.movieId}`

              return (
                <article 
                  key={group.movieId} 
                  className="review-group-card" 
                  style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  {/* Elokuvan / Sarjan yhteistiedot ja posteri */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                    <Link to={detailPath} style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
                      {group.posterUrl ? (
                        <img 
                          src={group.posterUrl} 
                          alt={group.movieTitle} 
                          style={{ width: '70px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                      ) : (
                        <div style={{ width: '70px', height: '100px', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center', borderRadius: '4px' }}>
                          {texts.posterMissing}
                        </div>
                      )}
                    </Link>

                    <div>
                      <h3 style={{ margin: '0 0 4px 0' }}>
                        <Link to={detailPath} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {group.movieTitle}
                        </Link>
                      </h3>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        Arvosteluja yhteensä: {group.reviews.length}
                      </p>
                    </div>
                  </div>

                  {/* Kyseisen kohteen kaikki käyttäjien arvostelut listattuna */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px' }}>
                    {group.reviews.map((review) => (
                      <div key={review.id} style={{ background: '#f9f9f9', padding: '10px', borderRadius: '6px' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                          <strong>{review.username || 'Tuntematon'}</strong>{' '}
                          <span aria-hidden="true" style={{ marginLeft: '8px' }}>
                            {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                          </span> ({review.stars}/5)
                        </p>
                        <p style={{ margin: '0 0 4px 0' }}>"{review.review_text}"</p>
                        <small style={{ color: '#888' }}>{new Date(review.created_at).toLocaleDateString(locale)}</small>
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