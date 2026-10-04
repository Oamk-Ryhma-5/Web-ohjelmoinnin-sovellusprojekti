import { useEffect, useState } from 'react'
import { addReviewApi, fetchMyReview, updateReviewApi, deleteReviewApi } from '../api.js'
import { useLanguage } from '../context/useLanguage.js'

export default function ReviewForm({ movie, onSaved }) {
  const { texts } = useLanguage()
  const [stars, setStars] = useState(3)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [textError, setTextError] = useState(false)
  const [status, setStatus] = useState('')
  const [existingReview, setExistingReview] = useState(null)
  const [editing, setEditing] = useState(false)

  // Haetaan käyttäjän oma arvostelu, kun elokuva vaihtuu
  useEffect(() => {
    async function loadOwnReview() {
      try {
        const review = await fetchMyReview(movie.id)

        if (review) {
          setExistingReview(review)
          setStars(review.stars)
          setText(review.review_text)
        } else {
          setExistingReview(null)
          setStars(3)
          setText('')
        }
      } catch (err) {
        console.error('Oman arvostelun lataus epäonnistui:', err)
      }
    }

    loadOwnReview()
  }, [movie.id])

  // Näyttää arvostelun esikatselun ennen tallennusta
  function showPreview(event) {
    event.preventDefault()

    const reviewText = text.trim()

    if (!reviewText) {
      setTextError(true)
      return
    }

    setPreview({
      stars,
      text: reviewText,
    })

    setTextError(false)
    setStatus('')
  }

  // Tallentaa uuden arvostelun tai päivittää olemassa olevan
  async function saveReview() {
    try {
      setStatus('Tallennetaan...')

      if (existingReview) {
        // Käyttäjällä on jo arvostelu, joten päivitetään se
        const updatedReview = await updateReviewApi(movie.id, {
          stars,
          reviewText: text.trim(),
        })

        setExistingReview(updatedReview)
        setStatus('Arvostelu päivitetty')

        // Suljetaan muokkaustila tallennuksen jälkeen
        setEditing(false)
        setPreview(null)
      } else {
        // Käyttäjällä ei vielä ole arvostelua, joten luodaan uusi
        const newReview = await addReviewApi({
          movieId: movie.id,
          movieTitle: movie.title,
          stars,
          reviewText: text.trim(),
        })

        setExistingReview(newReview)
        setStatus('Arvostelu tallennettu')

        // Esikatselua ei enää tarvita tallennuksen jälkeen
        setPreview(null)
      }

      if (onSaved) {
        onSaved()
      }
    } catch (err) {
      console.error('Arvostelun tallennus epäonnistui:', err)
      setStatus('Arvostelun tallennus epäonnistui')
    }
  }

  // Poistaa kirjautuneen käyttäjän oman arvostelun
  async function deleteOwnReview() {
    try {
      await deleteReviewApi(movie.id)

      // Tyhjennetään arvosteluun liittyvät tilat
      setExistingReview(null)
      setStars(3)
      setText('')
      setPreview(null)
      setTextError(false)
      setEditing(false)
      setStatus('Arvostelu poistettu')

      // Päivitetään myös MovieDetailsin arvostelulista
      if (onSaved) {
        onSaved()
      }
    } catch (err) {
      console.error('Arvostelun poistaminen epäonnistui:', err)
      setStatus('Arvostelun poistaminen epäonnistui')
    }
  }

  // Jos käyttäjällä on jo arvostelu eikä sitä muokata, näytetään vain oma arvostelu ja Muokkaa / Poista -napit
  if (existingReview && !editing) {
    return (
      <section className="panel review-form">
        <h2>Oma arvostelusi</h2>

        <p className="review-preview-stars">
          <span aria-hidden="true">
            {'★'.repeat(existingReview.stars)}
            {'☆'.repeat(5 - existingReview.stars)}
          </span>{' '}
          {existingReview.stars}/5
        </p>

        <p className="review-preview-text">
          {existingReview.review_text}
        </p>

        <div>
          <button
            className="button"
            type="button"
            onClick={() => {
              setEditing(true)
              setStatus('')
            }}
          >
            Muokkaa
          </button>

          <button
            className="button secondary"
            type="button"
            onClick={deleteOwnReview}
          >
            Poista arvostelu
          </button>
        </div>

        {status && <p>{status}</p>}
      </section>
    )
  }

  // Jos arvostelua ei ole tai käyttäjä painoi Muokkaa, näytetään arvostelulomake
  return (
    <section className="panel review-form">
      <h2>
        {existingReview ? 'Muokkaa arvostelua' : texts.writeReview}
      </h2>

      <form onSubmit={showPreview}>
        <div className="form-field">
          <label htmlFor="review-stars">{texts.stars}</label>

          <select
            id="review-stars"
            value={stars}
            onChange={(event) => setStars(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((number) => (
              <option key={number} value={number}>
                {number}/5
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="review-text">{texts.reviewText}</label>

          <textarea
            id="review-text"
            rows={5}
            maxLength={2000}
            required
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setTextError(false)
            }}
            aria-describedby="review-character-count"
          />

          <small id="review-character-count">
            {text.length}/2000 {texts.reviewCharacters}
          </small>
        </div>

        {textError && (
          <p className="form-error" role="alert">
            {texts.reviewTextRequired}
          </p>
        )}

        <button className="button" type="submit">
          {texts.reviewPreviewButton}
        </button>

        {existingReview && (
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setEditing(false)
              setPreview(null)
              setStars(existingReview.stars)
              setText(existingReview.review_text)
              setStatus('')
            }}
          >
            Peruuta
          </button>
        )}
      </form>

      {preview && (
        <section
          className="panel review-preview"
          aria-labelledby="preview-title"
        >
          <h3 id="preview-title">{texts.reviewPreviewTitle}</h3>

          <p className="review-preview-stars">
            <span aria-hidden="true">
              {'★'.repeat(preview.stars)}
              {'☆'.repeat(5 - preview.stars)}
            </span>{' '}
            {preview.stars}/5
          </p>

          <p className="review-preview-text">
            {preview.text}
          </p>

          <button
            className="button"
            type="button"
            onClick={saveReview}
          >
            {existingReview
              ? 'Tallenna muutokset'
              : 'Tallenna arvostelu'}
          </button>

          {status && <p>{status}</p>}
        </section>
      )}
    </section>
  )
}