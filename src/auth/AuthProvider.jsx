import { useCallback, useEffect, useRef, useState } from 'react'
import { requestJson } from '../api.js'
import { AuthContext } from './context.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const currentRequest = useRef(null)

  const refresh = useCallback(async () => {
    currentRequest.current?.abort()
    const controller = new AbortController()
    currentRequest.current = controller
    setError(null)
    try {
      const data = await requestJson('/api/auth/me', { signal: controller.signal })
      if (!controller.signal.aborted) setUser(data.user)
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) setUser(null)
      else setError(failure)
    } finally { if (!controller.signal.aborted) setLoading(false) }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    return () => { currentRequest.current?.abort(); window.removeEventListener('focus', refresh) }
  }, [refresh])

  async function authenticate(action, body) {
    currentRequest.current?.abort()
    const data = await requestJson(`/api/auth/${action}`, { method: 'POST', body })
    currentRequest.current?.abort()
    setUser(data.user)
    setError(null)
    setLoading(false)
    return data.user
  }

  async function logout() {
    await requestJson('/api/auth/logout', { method: 'POST' })
    currentRequest.current?.abort()
    setUser(null)
    setError(null)
  }

  async function updateProfile(username) {
    const data = await requestJson('/api/auth/profile', { method: 'PATCH', body: { username } })
    currentRequest.current?.abort()
    setUser(data.user)
  }

  return <AuthContext.Provider value={{ user, loading, error, refresh, authenticate, logout, updateProfile }}>{children}</AuthContext.Provider>
}
