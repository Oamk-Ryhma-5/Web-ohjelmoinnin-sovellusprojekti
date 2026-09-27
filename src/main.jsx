import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
<<<<<<< HEAD
import App from './App.jsx'
import LanguageProvider from './i18n/LanguageProvider.jsx'
import AuthProvider from './auth/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider><AuthProvider><App /></AuthProvider></LanguageProvider>
=======
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Home from './screens/Home.jsx'
import Search from './screens/Search.jsx'
import Authentication from './screens/Authentication.jsx'
import Groups from './screens/Groups.jsx'
import Account from './screens/Account.jsx'
import About from './screens/About.jsx'
import NotFound from './screens/NotFound.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import UserProvider from './context/UserProvider.jsx'
import LanguageProvider from './context/LanguageProvider.jsx'
import './index.css'

// React Router ja ProtectedRoute samalla periaatteella kuin Todo-tehtävässä.
// määritellään soveluksen reitit (react router) alla oleva rimpsu pitää kirjaa siitä mikä komponentti näytetäänmilläkin URl-ositteella.
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> }, //nyt teattereissa (etusivu)
      { path: 'haku', element: <Search /> }, //Hakusivu
      { path: 'kirjaudu', element: <Authentication key="login" mode="login" /> },
      { path: 'rekisteroidy', element: <Authentication key="register" mode="register" /> },
    
      { path: 'groups', element: <Groups />},   //ryhmäsivu 
      {  element: <ProtectedRoute />,
        children: [{ path: 'omat-tiedot', element: <Account /> }],
      },
      { path: 'tietoa', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </LanguageProvider>
>>>>>>> origin/yhdistetty-versio
  </StrictMode>,
)
