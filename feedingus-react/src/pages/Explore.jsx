import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import CartSidebar from '../components/CartSidebar'
import InvoiceModal from '../components/InvoiceModal'
import styles from './Explore.module.css'

export default function Explore() {
  const [menuItems, setMenuItems] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, msg: '', type: '' })
  const [lastPayment, setLastPayment] = useState(null)   // for success → invoice
  const [showInvoice, setShowInvoice] = useState(false)
  const { user, isLoggedIn } = useAuth()
  const { addToCart, totalItems, setIsOpen } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    api.getMenu()
      .then(res => setMenuItems(res.items))
      .catch(() => showToast('Failed to load food items', 'error'))
      .finally(() => setLoading(false))

    if (isLoggedIn && user?._id) {
      api.getRecommendations(user._id)
        .then(res => setRecommendations(res.recommendations))
        .catch(console.error)
    }
  }, [isLoggedIn, user?._id])

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000)
  }

  function handleAddToCart(item) {
    if (!isLoggedIn) { navigate('/login'); return }
    addToCart(item)
    showToast(`${item.name} added to cart 🛒`, 'success')
  }

  function handleCheckoutSuccess(data) {
    showToast('Order placed successfully! 🎉', 'success')
    // Show invoice modal with the payment data
    setLastPayment(data.payment)
    setShowInvoice(true)
  }

  // Group items by restaurant
  const groupedMenu = menuItems.reduce((acc, item) => {
    const restaurant = item.restaurantId
    if (!restaurant || !restaurant.restaurantName) return acc
    const rid = restaurant._id
    if (!acc[rid]) acc[rid] = { name: restaurant.restaurantName, items: [] }
    acc[rid].items.push(item)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}><i className="fas fa-utensils" /> Discover Food</h1>
          <p className={styles.subtitle}>Explore curated menus from our partner restaurants and support them by requesting your favorites.</p>
        </header>

        {isLoggedIn && recommendations.length > 0 && (
          <section className={styles.recommendationSection}>
            <h2 className={styles.sectionTitle}>✨ Recommended for You</h2>
            <div className={styles.recommendationScroll}>
              {recommendations.map(item => (
                <div key={item._id} className={`${styles.foodCard} ${styles.miniCard} glass-card`}>
                  <div className={styles.foodInfo}>
                    <span className={styles.foodCategory}>{item.category}</span>
                    <h3>{item.name}</h3>
                  </div>
                  <div className={styles.foodPrice}>₹{item.price}</div>
                  <button className={`${styles.orderBtn} btn mini`} onClick={() => handleAddToCart(item)}>
                    <i className="fas fa-plus" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--orange)' }} />
            <p style={{ marginTop: '20px', color: '#aaa' }}>Fetching local menus...</p>
          </div>
        ) : Object.keys(groupedMenu).length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <i className="fas fa-store-slash" style={{ fontSize: '48px', color: '#444', marginBottom: '20px' }} />
            <p style={{ color: '#aaa' }}>No restaurants have posted their menus yet. Check back soon!</p>
          </div>
        ) : (
          Object.entries(groupedMenu).map(([id, group]) => (
            <section key={id} className={styles.restaurantSection}>
              <div className={styles.restaurantHeader}>
                <div className={styles.restaurantIcon}><i className="fas fa-store" /></div>
                <h2 className={styles.restaurantName}>{group.name}</h2>
              </div>
              <div className={styles.menuGrid}>
                {group.items.map(item => (
                  <div key={item._id} className={`${styles.foodCard} glass-card`}>
                    <div className={styles.foodInfo}>
                      <span className={styles.foodCategory}>{item.category}</span>
                      <h3>{item.name}</h3>
                      <p style={{ fontSize: '13px', color: '#888', margin: '8px 0', lineHeight: '1.4' }}>
                        {item.description || 'No description available for this item.'}
                      </p>
                    </div>

                    <div className={styles.foodPrice}><span>₹</span>{item.price}</div>

                    <div className={styles.tagRow}>
                      <span className={`${styles.typeTag} ${item.type === 'veg' ? styles.veg : styles.nonVeg}`}>
                        <i className={`fas ${item.type === 'veg' ? 'fa-leaf' : 'fa-drumstick-bite'}`} style={{ marginRight: '6px' }} />
                        {item.type}
                      </span>
                      {item.tags?.map(tag => (
                        <span key={tag} className={styles.typeTag} style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa' }}>{tag}</span>
                      ))}
                    </div>

                    <button className={`${styles.orderBtn} btn`} onClick={() => handleAddToCart(item)}>
                      <i className="fas fa-cart-plus" style={{ marginRight: 8 }} />
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Floating cart button */}
      {isLoggedIn && totalItems > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', zIndex: 800,
            background: '#f08804', border: 'none', borderRadius: '50px',
            color: '#fff', fontWeight: 700, fontSize: '15px',
            padding: '14px 24px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 4px 24px rgba(240,136,4,0.5)',
            animation: 'pulse 2s infinite',
          }}
        >
          <i className="fas fa-shopping-cart" />
          {totalItems} item{totalItems > 1 ? 's' : ''} · View Cart
        </button>
      )}

      <CartSidebar onCheckoutSuccess={handleCheckoutSuccess} />

      {showInvoice && lastPayment && (
        <InvoiceModal invoice={lastPayment} onClose={() => setShowInvoice(false)} />
      )}

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`} role="status">{toast.msg}</div>
    </div>
  )
}
