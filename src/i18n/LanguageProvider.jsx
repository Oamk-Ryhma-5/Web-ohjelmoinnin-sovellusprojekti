import { useCallback, useEffect, useMemo, useState } from 'react'
import { I18nContext } from './context.js'
import { messages } from './messages.js'

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('leffahaku-language') === 'en' ? 'en' : 'fi' } catch { return 'fi' }
  })
  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem('leffahaku-language', language) } catch { /* Yksityinen selaustila. */ }
  }, [language])
  const t = useCallback((key, values = {}) => {
    const text = messages[language][key] || messages.fi[key] || key
    return text.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match))
  }, [language])
  const errorText = useCallback(error => t(`error.${messages[language][`error.${error?.code}`] ? error.code : 'SERVER_ERROR'}`), [language, t])
  const value = useMemo(() => ({ language, locale: language === 'fi' ? 'fi-FI' : 'en-US', setLanguage, t, errorText }), [language, t, errorText])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
