import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import { useLanguage } from './context/useLanguage.js'
import './App.css'

export default function App() {
  const { pathname } = useLocation()
  const { texts } = useLanguage()

  useEffect(() => {
    const titles = {
      '/': texts.theaters,
      '/haku': texts.search,
      '/kirjaudu': texts.signIn,
      '/rekisteroidy': texts.signUp,
      '/omat-tiedot': texts.account,
      '/tietoa': texts.about,
      '/suosikit': texts.favorites,
      '/reviews': texts.reviews,
      '/ryhmat': texts.groups || 'Ryhmät'
    }

    // Tarkistetaan onko kyseessä yksittäinen ryhmäsivu (/ryhma/:id)
    const currentTitle = pathname.startsWith('/ryhma/')
      ? `${texts.groups || 'Ryhmä'} #${pathname.split('/')[2]}`
      : titles[pathname] || texts.notFound

    document.title = `Leffahaku · ${currentTitle}`
  }, [pathname, texts])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="app">
      {/* TÄSSÄ GITHUB ACTIONS : */}
      <a className="skip-link" href="#main">
        {texts.skip}
      </a>
      <Header />
      <main id="main" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
