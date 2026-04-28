import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [search, setSearch] = useState('')
  const { isLoggedIn, logoutUser, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      alert(`Searching for: "${search}" (feature coming soon!)`)
      setSearch('')
    }
  }

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <NavLink to="/" className={styles.logo}>
        feeding<span>us</span>.com
      </NavLink>

      <div className={styles.links}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ''} end>Home</NavLink>
        {(user && !user.restaurantName) && (
          <NavLink to="/explore" className={({ isActive }) => isActive ? styles.active : ''}>Explore Food</NavLink>
        )}
        <NavLink to="/about" className={({ isActive }) => isActive ? styles.active : ''}>About</NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? styles.active : ''}>Contact</NavLink>
      </div>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <label htmlFor="nav-search" className="sr-only">Search</label>
        <input
          id="nav-search"
          type="text"
          placeholder="Search here..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit"><i className="fas fa-search" /></button>
      </form>

      <div className={styles.authLinks} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {isLoggedIn ? (
          <>
            <span style={{ fontSize: '13px', color: '#aaa' }}>Hi, {user?.name}</span>
            <Link to="/dashboard" className="btn" style={{ padding: '8px 16px', fontSize: '13px' }}>Dashboard</Link>
            <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', background: 'transparent', border: '1px solid #f08804' }} onClick={() => { logoutUser(); navigate('/'); }}>Logout</button>
          </>
        ) : (
          <Link to="/login" className="btn" style={{ padding: '8px 16px', fontSize: '13px' }}>Login</Link>
        )}
      </div>
    </nav>
  )
}
