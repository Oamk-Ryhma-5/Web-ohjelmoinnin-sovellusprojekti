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

// Hae käyttäjän suosikit
export const fetchFavorites = async () => {
  const response = await api.get('/api/favorites');
  return response.data;
};

// Lisää elokuva suosikkeihin
export const addFavoriteApi = async (movieData) => {
  const response = await api.post('/api/favorites', movieData);
  return response.data;
};

// Poista elokuva suosikeista
export const removeFavoriteApi = async (movieId) => {
  const response = await api.delete(`/api/favorites/${movieId}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};