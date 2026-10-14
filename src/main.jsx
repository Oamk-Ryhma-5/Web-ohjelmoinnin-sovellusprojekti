import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'

import Home from './screens/Home.jsx'
import Search from './screens/Search.jsx'
import Authentication from './screens/Authentication.jsx'
import Groups from './screens/Groups.jsx'
import Reviews from './screens/Reviews.jsx'
import GroupDetail from './screens/groupDetail.jsx'
import Account from './screens/Account.jsx'
import About from './screens/About.jsx'
import NotFound from './screens/NotFound.jsx'
import MovieDetails from './screens/MovieDetails.jsx'
import Favorites from './screens/favorites.jsx' // 1. Tuodaan Favorites-ruutu
import SharedFavorites from './screens/SharedFavorites.jsx'
import Favorites from './screens/favorites.jsx'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import UserProvider from './context/UserProvider.jsx'
import LanguageProvider from './context/LanguageProvider.jsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'haku', element: <Search /> },
      { path: 'movie/:id', element: <MovieDetails /> },
      { path: 'suosikit/shared/:accountId', element: <SharedFavorites /> },
      { path: 'tv/:id', element: <MovieDetails /> }, // <--- Lisätty reitti sarjoille!
      { path: 'kirjaudu', element: <Authentication key="login" mode="login" /> },
      { path: 'rekisteroidy', element: <Authentication key="register" mode="register" /> },
      { path: 'groups', element: <Groups /> },
      { path: 'reviews', element: <Reviews /> },
      { path: 'ryhma/:id', element: <GroupDetail /> },
      
      { 
        element: <ProtectedRoute />,
        children: [
          { path: 'omat-tiedot', element: <Account /> },
          { path: 'suosikit', element: <Favorites /> }
        ],
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
  </StrictMode>,
)