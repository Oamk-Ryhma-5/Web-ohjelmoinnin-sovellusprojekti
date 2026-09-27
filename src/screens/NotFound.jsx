import { Link } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage.js'

export default function NotFound() {
  const { texts } = useLanguage()
  return (
    <section className="small-page panel">
      <p className="muted">404</p>
      <h1>{texts.notFound}</h1>
      <Link className="button" to="/">
        {texts.backHome}
      </Link>
    </section>
  )
}
