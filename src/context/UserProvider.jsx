import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { UserContext } from './UserContext.js'

export default function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function checkUser() {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get('/api/auth/me', { signal: controller.signal })
        setUser(response.data.user)
      } catch (error) {
        if (controller.signal.aborted) return
        if (error.response?.status === 401) {
          setUser(null)
        } else {
          setError(error)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    checkUser()
    return () => controller.abort()
  }, [retry])

  async function signIn(email, password) {
    const response = await api.post('/api/auth/login', { email, password })
    setUser(response.data.user)
    setError(null)
  }

  async function signUp(username, email, password) {
    const response = await api.post('/api/auth/register', { username, email, password })
    setUser(response.data.user)
    setError(null)
  }

  async function signOut() {
    await api.post('/api/auth/logout', {})
    setUser(null)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        retry: () => setRetry((value) => value + 1),
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
