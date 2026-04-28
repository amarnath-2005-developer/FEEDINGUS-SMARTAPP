import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Explore from './pages/Explore'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout({ children }) {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard'
  return (
    <>
      <Navbar />
      <main className="page-enter">{children}</main>
      {!isDashboard && <ChatWidget />}
      <Footer />
    </>
  )
}

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <div style={{ color: 'white', padding: '100px', textAlign: 'center' }}>Loading...</div>
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/explore" element={<Layout><Explore /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/dashboard" element={<Layout><ProtectedRoute><Dashboard /></ProtectedRoute></Layout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
