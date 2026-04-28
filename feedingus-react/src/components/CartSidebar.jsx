import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { api } from '../api/api'
import styles from './CartSidebar.module.css'

const GST_RATE = 0.18
const DELIVERY_FEE = 40

export default function CartSidebar({ onCheckoutSuccess }) {
  const { cart, restaurantName, isOpen, setIsOpen, addToCart, removeFromCart, clearCart, subtotal } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={() => setIsOpen(false)} />

      {/* Sidebar panel */}
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <h2><i className="fas fa-shopping-cart" /> Your Cart</h2>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
            <i className="fas fa-times" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-bowl-food" />
            <p>Your cart is empty</p>
            <span>Add items from the menu to get started</span>
          </div>
        ) : (
          <>
            <p className={styles.restaurantTag}>
              <i className="fas fa-store" /> {restaurantName}
            </p>

            <div className={styles.itemList}>
              {cart.map(({ item, quantity }) => (
                <div key={item._id} className={styles.cartItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>₹{item.price}</span>
                  </div>
                  <div className={styles.qtyRow}>
                    <button className={styles.qtyBtn} onClick={() => removeFromCart(item._id)}>−</button>
                    <span className={styles.qty}>{quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => addToCart(item)}>+</button>
                    <span className={styles.lineTotal}>₹{(item.price * quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price summary */}
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>GST (18%)</span><span>₹{(subtotal * GST_RATE).toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Delivery Fee</span><span>₹{DELIVERY_FEE.toFixed(2)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.grandRow}`}>
                <span>Grand Total</span>
                <span>₹{(subtotal + subtotal * GST_RATE + DELIVERY_FEE).toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.clearBtn} onClick={clearCart}>
                <i className="fas fa-trash" /> Clear
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setShowCheckout(true)}>
                <i className="fas fa-credit-card" /> Checkout
              </button>
            </div>
          </>
        )}
      </aside>

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={(data) => {
            setShowCheckout(false)
            setIsOpen(false)
            clearCart()
            onCheckoutSuccess?.(data)
          }}
        />
      )}
    </>
  )
}

// ── Inline Checkout Modal ────────────────────────────────────────────────────
function CheckoutModal({ onClose, onSuccess }) {
  const { cart, restaurantId, restaurantName, subtotal } = useCart()
  const [paymentMode, setPaymentMode] = useState('cod')
  const [discount, setDiscount] = useState(0)
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const COUPONS = { FEED10: 10, WELCOME20: 20, HUNGRY50: 50 }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (COUPONS[code]) {
      setDiscount(COUPONS[code])
      setCouponMsg(`✅ Coupon applied! ₹${COUPONS[code]} off`)
    } else {
      setDiscount(0)
      setCouponMsg('❌ Invalid coupon code')
    }
  }

  const gst = +(subtotal * GST_RATE).toFixed(2)
  const grandTotal = +(subtotal + gst + DELIVERY_FEE - discount).toFixed(2)

  async function handlePlaceOrder() {
    setLoading(true)
    setError('')
    try {
      const items = cart.map(({ item, quantity }) => ({
        menuItemId: item._id,
        name: item.name,
        quantity,
        price: item.price,
      }))
      const data = await api.createPayment({
        restaurantId, restaurantName, items, paymentMode, discount,
      })
      onSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3><i className="fas fa-receipt" /> Checkout</h3>
          <button className={styles.closeBtn} onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        {/* Items */}
        <div className={styles.modalItems}>
          {cart.map(({ item, quantity }) => (
            <div key={item._id} className={styles.modalItem}>
              <span>{item.name} × {quantity}</span>
              <span>₹{(item.price * quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className={styles.couponRow}>
          <input
            type="text"
            placeholder="Coupon code (e.g. FEED10)"
            value={couponInput}
            onChange={e => setCouponInput(e.target.value)}
            className={styles.couponInput}
          />
          <button className={styles.couponBtn} onClick={applyCoupon}>Apply</button>
        </div>
        {couponMsg && <p className={styles.couponMsg}>{couponMsg}</p>}

        {/* Billing breakdown */}
        <div className={styles.breakdown}>
          <div className={styles.bRow}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className={styles.bRow}><span>GST (18%)</span><span>₹{gst.toFixed(2)}</span></div>
          <div className={styles.bRow}><span>Delivery Fee</span><span>₹{DELIVERY_FEE.toFixed(2)}</span></div>
          {discount > 0 && <div className={styles.bRow} style={{ color: '#4caf50' }}><span>Discount</span><span>−₹{discount.toFixed(2)}</span></div>}
          <div className={`${styles.bRow} ${styles.grandRow}`}><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
        </div>

        {/* Payment mode */}
        <div className={styles.modeRow}>
          <button
            className={`${styles.modeBtn} ${paymentMode === 'cod' ? styles.modeActive : ''}`}
            onClick={() => setPaymentMode('cod')}
          >
            💵 Cash on Delivery
          </button>
          <button
            className={`${styles.modeBtn} ${paymentMode === 'card_simulated' ? styles.modeActive : ''}`}
            onClick={() => setPaymentMode('card_simulated')}
          >
            💳 Pay Now (Simulated)
          </button>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <button className="btn" style={{ width: '100%', marginTop: '12px', padding: '14px' }} onClick={handlePlaceOrder} disabled={loading}>
          {loading ? <><i className="fas fa-spinner fa-spin" /> Processing...</> : <><i className="fas fa-check-circle" /> Place Order — ₹{grandTotal.toFixed(2)}</>}
        </button>
      </div>
    </div>
  )
}
