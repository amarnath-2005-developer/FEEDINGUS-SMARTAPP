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

  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [signupEmail, setSignupEmail] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login({ email, password })
      loginUser(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      if (err.message.includes('not verified')) {
        setSignupEmail(email)
        setOtpModalOpen(true)
        setError('')
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (!otpCode.trim()) { setError('OTP is required.'); return }
    
    setError('')
    setLoading(true)
    try {
      const data = await api.verifyOtp({ email: signupEmail, otp: otpCode })
      loginUser(data.user, data.token)
      setOtpModalOpen(false)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid OTP')
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

      {/* OTP Modal for Unverified Users */}
      {otpModalOpen && (
        <div className={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) setOtpModalOpen(false) }}>
          <div className={styles.modal}>
            <h2>Verify Account</h2>
            <p className={styles.modalSub}>A new OTP has been sent to {signupEmail}</p>
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>OTP Code</label>
                <input type="text" placeholder="123456" maxLength={6}
                  value={otpCode} onChange={e => setOtpCode(e.target.value)} required />
              </div>
              {error && <p className="error-msg" style={{ color: '#ff5c5c', marginBottom: '10px' }}>{error}</p>}
              <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button type="button" className={styles.modalClose} onClick={() => setOtpModalOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
