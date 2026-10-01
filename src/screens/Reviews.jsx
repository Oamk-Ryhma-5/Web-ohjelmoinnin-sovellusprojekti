import { useState } from 'react'
import { useLanguage } from '../context/useLanguage.js'

export default function Reviews() {
  const { texts } = useLanguage()
  const [stars, setStars] = useState(3)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [textError, setTextError] = useState(false)

  function showPreview(event) {
    event.preventDefault()
    const reviewText = text.trim()

    if (!reviewText) {
      setTextError(true)
      return
    }

    // Esikatselu saa kopion lomakkeen nykyisistä arvoista.
    setPreview({ stars, text: reviewText })
    setTextError(false)
  }

  return (
    <section className="reviews-page" aria-labelledby="reviews-title">
      <header className="page-heading">
        <h1 id="reviews-title">{texts.reviews}</h1>
        <p>{texts.reviewDraftHint}</p>
      </header>

      <form className="panel review-form" onSubmit={showPreview}>
        <h2>{texts.writeReview}</h2>

        <div className="form-field">
          <label htmlFor="review-stars">{texts.stars}</label>
          <select
            id="review-stars"
            value={stars}
            onChange={(event) => setStars(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((number) => (
              <option key={number} value={number}>{number}/5</option>
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
          <small id="review-character-count">{text.length}/2000 {texts.reviewCharacters}</small>
        </div>

        {textError && <p className="form-error" role="alert">{texts.reviewTextRequired}</p>}

        <button className="button" type="submit">{texts.reviewPreviewButton}</button>
      </form>

      {preview && (
        <section className="panel review-preview" aria-labelledby="preview-title">
          <h2 id="preview-title">{texts.reviewPreviewTitle}</h2>
          <p className="review-preview-stars">
            <span aria-hidden="true">{'★'.repeat(preview.stars)}{'☆'.repeat(5 - preview.stars)}</span>
            {' '}{preview.stars}/5
          </p>
          <p className="review-preview-text">{preview.text}</p>
        </section>
      )}
    </section>
  )
}
