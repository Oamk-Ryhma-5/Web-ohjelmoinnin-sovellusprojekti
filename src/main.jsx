import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Home from './screens/Home.jsx'
import Search from './screens/Search.jsx'
import Authentication from './screens/Authentication.jsx'
import Account from './screens/Account.jsx'
import About from './screens/About.jsx'
import NotFound from './screens/NotFound.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import UserProvider from './context/UserProvider.jsx'
import LanguageProvider from './context/LanguageProvider.jsx'
import './index.css'

// React Router ja ProtectedRoute samalla periaatteella kuin Todo-tehtävässä.
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'haku', element: <Search /> },
      { path: 'kirjaudu', element: <Authentication key="login" mode="login" /> },
      { path: 'rekisteroidy', element: <Authentication key="register" mode="register" /> },
      {
        element: <ProtectedRoute />,
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
  </StrictMode>,
)
