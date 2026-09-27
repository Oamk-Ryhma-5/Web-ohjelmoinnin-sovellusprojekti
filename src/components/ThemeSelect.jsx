import { useEffect, useState } from 'react'
import { useLanguage } from '../context/useLanguage.js'

function savedTheme() {
  try {
    return localStorage.getItem('leffahaku-theme') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export default function ThemeSelect() {
  const [theme, setTheme] = useState(savedTheme)
  const { texts } = useLanguage()

  useEffect(() => {
    // CSS vaihtaa koko sivun värit tämän arvon perusteella.
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('leffahaku-theme', theme)
    } catch {
      // Valinta toimii, vaikka selain estäisi sen tallentamisen.
    }
  }, [theme])

  return (
    <select
      className="theme-select"
      aria-label={texts.theme}
      value={theme}
      onChange={(event) => setTheme(event.target.value)}
    >
      <option value="light">{texts.lightTheme}</option>
      <option value="dark">{texts.darkTheme}</option>
    </select>
  )
}
