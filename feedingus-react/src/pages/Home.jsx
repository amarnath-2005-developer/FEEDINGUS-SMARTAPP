import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/api'
import styles from './Home.module.css'
import heroBg from '../assets/hero_banner.png'
import slide1 from '../assets/slide1.png'
import slide2 from '../assets/slide2.png'
import slide3 from '../assets/slide3.png'

const SERVICES = [
  'Restaurant Dashboard', 'User Dashboard', 'Admin Portal',
  'Authentication Service', 'Donation Management', 'Notification Service',
]

const SLIDES = [
  { img: slide1, title: 'Restaurant Dashboard', desc: 'Manage menus, orders, and analytics efficiently.' },
  { img: slide2, title: 'User Dashboard', desc: 'Track your orders and explore the best local food deals.' },
  { img: slide3, title: 'Admin Portal', desc: 'Oversee platform-wide activity with admin-level controls.' },
]


export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [role, setRole] = useState('user')
  const [restaurantName, setRestaurantName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, msg: '', type: '' })
  const [slideIdx, setSlideIdx] = useState(0)
  const navigate = useNavigate()
  const emailRef = useRef(null)

  /* Auto-slide */
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [])

  /* Focus trap for modal */
  useEffect(() => {
    if (modalOpen) emailRef.current?.focus()
  }, [modalOpen])

  /* Keyboard close */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && modalOpen) closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modalOpen])

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000)
  }

  function closeModal() {
    setModalOpen(false)
    setOtpModalOpen(false)
    setName(''); setEmail(''); setPassword(''); setConfirm(''); setRestaurantName(''); setRole('user'); setOtpCode('')
    setError(''); setLoading(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    
    // Client-side validation
    if (!name.trim()) { setError('Name is required.'); return }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setError('Valid email is required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (role === 'restaurant' && !restaurantName.trim()) { setError('Restaurant name is required.'); return }
    
    setError('')
    setLoading(true)
    try {
      await api.register({ 
        name, 
        email, 
        password, 
        restaurantName: role === 'restaurant' ? restaurantName : '', 
        restaurantLocation: role === 'restaurant' ? 'Pending Location' : '' 
      })
      setSignupEmail(email)
      setModalOpen(false)
      setOtpModalOpen(true)
      showToast('OTP sent to your email!', 'success')
    } catch (err) {
      console.error('Signup Error:', err)
      setError(err.message || 'Registration failed. Please try again.')
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
      await api.verifyOtp({ email: signupEmail, otp: otpCode })
      closeModal()
      showToast('Account verified! Please log in.', 'success')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    setError('')
    setLoading(true)
    try {
      await api.resendOtp(signupEmail)
      showToast('New OTP sent!', 'success')
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero} style={{ backgroundImage: `url(${heroBg})` }}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroBadge}>🍽️ Connecting Restaurants & Users</p>
          <h1 className={styles.heroTitle}>
            Welcome to <span>FeedingUs</span>
          </h1>
          <p className={styles.heroSub}>
            Discover exclusive offers from restaurants. Fight hunger. Reduce waste.
          </p>
          <div className={styles.heroBtns}>
            <button className="btn" id="signup-btn" onClick={() => setModalOpen(true)}>Sign Up</button>
            <button className="btn" id="login-btn" style={{ background: 'transparent', border: '1px solid rgba(240,136,4,0.6)' }}
              onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>
      </section>

      {/* Scrolling ticker */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {[...Array(3)].map((_, i) => (
            <span key={i}>
              Connecting You Seamlessly with Restaurants — Discover Exclusive Offers &nbsp;&nbsp;•&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Services scroller */}
      <section className={styles.services}>
        <h2 className="section-title">Our Services</h2>
        <p className="section-sub">Everything you need to manage donations and reduce food waste</p>
        <div className={styles.scroller}>
          <div className={styles.scrollTrack}>
            {[...SERVICES, ...SERVICES].map((s, i) => (
              <div key={i} className={`${styles.serviceCard} glass-card`}>{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Slider */}
      <section className={styles.sliderSection}>
        <div className={styles.sliderWrap}>
          <div className={styles.sliderTrack} style={{ transform: `translateX(-${slideIdx * 100}%)` }}>
            {SLIDES.map((sl, i) => (
              <div key={i} className={styles.slide}>
                <img src={sl.img} alt={sl.title} loading="lazy" />
                <div className={styles.slideText}>
                  <h2>{sl.title}</h2>
                  <p>{sl.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.dots}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === slideIdx ? styles.dotActive : ''}`}
                onClick={() => setSlideIdx(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Sign-up Modal */}
      {modalOpen && (
        <div className={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={closeModal} aria-label="Close">
              <i className="fas fa-times" />
            </button>
            <h2 id="modal-title">Create Account</h2>
            <p className={styles.modalSub}>Join FeedingUs and make a difference</p>
            <form className={styles.modalForm} onSubmit={handleSignup} noValidate>
              <div className="form-group" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal' }}>
                  <input type="radio" name="role" checked={role === 'user'} onChange={() => setRole('user')} /> User
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal' }}>
                  <input type="radio" name="role" checked={role === 'restaurant'} onChange={() => setRole('restaurant')} /> Restaurant
                </label>
              </div>
              {role === 'restaurant' && (
                <div className="form-group">
                  <label htmlFor="su-rest">Restaurant Name</label>
                  <input id="su-rest" type="text" placeholder="My Restaurant"
                    value={restaurantName} onChange={e => setRestaurantName(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="su-name">Full Name</label>
                <input ref={emailRef} id="su-name" type="text" placeholder="John Doe"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="su-email">Email Address</label>
                <input id="su-email" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="su-pw">Password</label>
                <input id="su-pw" type="password" placeholder="Min 8 chars, A-Z, 0-9, special"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="su-cpw">Confirm Password</label>
                <input id="su-cpw" type="password" placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              {error && <p className="error-msg"><i className="fas fa-exclamation-circle" /> {error}</p>}
              <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <p className={styles.loginLink}>
                Already have an account?{' '}
                <button type="button" onClick={() => { closeModal(); navigate('/login') }}>Log In</button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {otpModalOpen && (
        <div className={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          role="dialog" aria-modal="true" aria-labelledby="otp-title">
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={closeModal} aria-label="Close">
              <i className="fas fa-times" />
            </button>
            <h2 id="otp-title">Verify Email</h2>
            <p className={styles.modalSub}>Enter the 6-digit OTP sent to {signupEmail}</p>
            <form className={styles.modalForm} onSubmit={handleVerifyOtp} noValidate>
              <div className="form-group">
                <label htmlFor="su-otp">OTP Code</label>
                <input id="su-otp" type="text" placeholder="123456" maxLength={6}
                  value={otpCode} onChange={e => setOtpCode(e.target.value)} required />
              </div>

              {error && <p className="error-msg"><i className="fas fa-exclamation-circle" /> {error}</p>}
              <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                Didn't receive code?{' '}
                <button type="button" onClick={handleResendOtp} 
                  style={{ background: 'none', border: 'none', color: 'var(--orange)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  Resend OTP
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`} role="status">
        {toast.msg}
      </div>
    </div>
  )
}
