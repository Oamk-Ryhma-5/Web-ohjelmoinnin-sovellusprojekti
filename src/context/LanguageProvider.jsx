import { useEffect, useState } from 'react'
import { LanguageContext } from './LanguageContext.js'
import { translations } from '../translations.js'

function savedLanguage() {
  try {
    return localStorage.getItem('leffahaku-language') === 'en' ? 'en' : 'fi'
  } catch {
    return 'fi'
  }
}

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(savedLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem('leffahaku-language', language)
    } catch {
      // Kielivalinta toimii myös silloin, kun selain estää tallennuksen.
    }
  }, [language])

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        locale: language === 'en' ? 'en-US' : 'fi-FI',
        texts: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}
