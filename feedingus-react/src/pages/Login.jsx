import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/api'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login({ email, password })
      loginUser(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.logo}>feeding<span>us</span></div>
          <h1>Welcome back</h1>
          <p>Sign in to your restaurant dashboard</p>
        </div>
        <form className={styles.form} id="login-form" onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label htmlFor="l-email">Email Address</label>
            <input id="l-email" type="email" placeholder="you@example.com" required
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="l-pw">Password</label>
            <input id="l-pw" type={showPw ? 'text' : 'password'} placeholder="Enter password" required
              value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            <button type="button" className={styles.pwToggle} onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>
          {error && <div className="error-msg" style={{ color: '#ff5c5c', fontSize: '14px', marginBottom: '10px' }}><i className="fas fa-circle-exclamation" /> {error}</div>}
          <div className={styles.forgotRow}>
            <a href="#" className={styles.forgot}>Forgotten password?</a>
          </div>
          <button type="submit" className="btn" id="login-btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : <><i className="fas fa-right-to-bracket" /> &nbsp;Login</>}
          </button>
        </form>
        <p className={styles.signup}>
          Don't have an account? <Link to="/">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
