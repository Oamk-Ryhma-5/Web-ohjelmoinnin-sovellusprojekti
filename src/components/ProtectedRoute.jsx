import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '../context/useUser.js'
import { useLanguage } from '../context/useLanguage.js'
import { errorMessage } from '../api.js'

export default function ProtectedRoute() {
  const { user, loading, error, retry } = useUser()
  const { texts } = useLanguage()

  if (loading)
    return (
      <p className="status-message" role="status">
        {texts.loading}
      </p>
    )
  if (error)
    return (
      <div className="status-message">
        <p role="alert">{errorMessage(error, texts)}</p>
        <button className="button" onClick={retry}>
          {texts.retry}
        </button>
      </div>
    )
  if (!user) return <Navigate to="/kirjaudu" replace />
  return <Outlet />
}
