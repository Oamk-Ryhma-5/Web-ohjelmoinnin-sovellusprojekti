import axios from 'axios'

// Sama Axios-kirjasto kuin Docker-pohjassa ja Todo-tehtävässä.
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
