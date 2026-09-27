<<<<<<< HEAD
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function requestJson(path, { signal, method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      signal, method, credentials: 'include',
      ...(method !== 'GET' ? {
        headers: { 'Content-Type': 'application/json', 'X-Leffahaku-Request': '1' },
        body: JSON.stringify(body || {}),
      } : {}),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw Object.assign(new Error('Network error'), { code: 'NETWORK_ERROR' })
  }
  if (response.status === 204) return null
  let data
  try {
    data = await response.json()
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw Object.assign(new Error('Invalid response'), { code: 'INVALID_RESPONSE' })
  }
  if (!response.ok) throw Object.assign(new Error(data.error?.message || 'Request failed'), { code: data.error?.code || 'SERVER_ERROR', status: response.status })
  return data
}

export const getJson = (path, signal) => requestJson(path, { signal })
=======
import axios from 'axios'

// Tyhjä osoite käyttää Viten /api-välitystä. Eväste kulkee pyynnön mukana.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  timeout: 12000,
  headers: { 'X-Leffahaku-Request': '1' },
})

export function errorMessage(error, texts) {
  const code = error?.response?.data?.error?.code || error?.code
  if (texts.errors[code]) return texts.errors[code]
  return texts.errors.SERVER_ERROR
}
>>>>>>> origin/yhdistetty-versio
