import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import useSocket from '../hooks/useSocket'
import OrderTracker from '../components/OrderTracker'
import InvoiceModal from '../components/InvoiceModal'
import styles from './Dashboard.module.css'

const STATUS_COLOR = {
  pending: '#f08804', confirmed: '#f08804',
  preparing: '#2196f3', out_for_delivery: '#ab47bc',
  delivered: '#4caf50', cancelled: '#ff5c5c',
}
const STATUS_LABEL = {
  pending: 'Confirmed', confirmed: 'Confirmed', preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
}
const PAY_COLOR = { paid: '#4caf50', pending: '#f08804', failed: '#ff5c5c' }

export default function UserDashboard() {
  const { user, logoutUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [expanded, setExpanded] = useState({})
  const [activeTab, setActiveTab] = useState('orders')   // 'orders' | 'payments'
  const [toast, setToast] = useState({ show: false, msg: '', type: '' })
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const navigate = useNavigate()
  const socket = useSocket()

  useEffect(() => {
    api.getMyOrders().then(r => setOrders(r.orders)).catch(e => showToast(e.message, 'error'))
    api.getPaymentHistory().then(r => setPayments(r.payments)).catch(() => {})
  }, [])

  // Live socket updates
  useEffect(() => {
    if (!socket) return
    function onUpdate(data) {
      setOrders(prev => prev.map(o => o._id === data.orderId
        ? { ...o, status: data.status, statusHistory: data.statusHistory,
            estimatedDeliveryTime: data.estimatedDeliveryTime, deliveredAt: data.deliveredAt }
        : o
      ))
      showToast(`Order update: ${STATUS_LABEL[data.status] || data.status} 🔔`, 'success')
    }
    socket.on('order:updated', onUpdate)
    return () => socket.off('order:updated', onUpdate)
  }, [socket])

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 4000)
  }

  async function handleViewInvoice(paymentId) {
    try {
      const res = await api.getInvoice(paymentId)
      setSelectedInvoice(res.invoice)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleClearOrders() {
    if (!confirmClear) { setConfirmClear(true); return }
    try {
      await api.clearMyOrders()
      setOrders([])
      setPayments([])
      setConfirmClear(false)
      showToast('All your history cleared!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  function logout() { logoutUser(); navigate('/') }

  const totalSpent = payments.reduce((s, p) => s + (p.grandTotal || 0), 0)
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const paidCount = payments.filter(p => p.status === 'paid').length

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div>
          <span className={styles.restaurantBadge} style={{ background: 'rgba(33,150,243,0.1)', color: '#2196f3' }}>
            <i className="fas fa-user" />
          </span>
          <div>
            <h1 className={styles.restaurantName}>Hi, {user?.name}</h1>
            <p className={styles.restaurantMeta}><i className="fas fa-envelope" /> {user?.email}</p>
          </div>
        </div>
        <button className="btn" onClick={logout}><i className="fas fa-right-from-bracket" />&nbsp;Logout</button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {[
          { icon: 'fa-receipt', color: '#2196f3', val: orders.length, label: 'Total Orders' },
          { icon: 'fa-spinner', color: '#f08804', val: activeOrders.length, label: 'Active' },
          { icon: 'fa-check-circle', color: '#4caf50', val: paidCount, label: 'Paid Bills' },
          { icon: 'fa-money-bill-wave', color: '#f08804', val: `₹${totalSpent.toFixed(0)}`, label: 'Total Spent' },
        ].map((s, i) => (
          <div key={i} className={`${styles.statCard} glass-card`}>
            <i className={`fas ${s.icon}`} style={{ color: s.color }} />
            <div>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Actions */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
            {[
              { key: 'orders', icon: 'fa-history', label: 'Order History' },
            { key: 'payments', icon: 'fa-credit-card', label: 'Payments & Invoices' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7,
                background: activeTab === tab.key ? '#f08804' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#777',
                transition: 'all 0.2s',
              }}
            >
              <i className={`fas ${tab.icon}`} />{tab.label}
            </button>
          ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {confirmClear && <span style={{ fontSize: '12px', color: '#ff5c5c' }}>Are you sure?</span>}
            <button className="btn" onClick={handleClearOrders} style={{ padding: '6px 12px', fontSize: '12px', background: confirmClear ? '#ff5c5c' : 'transparent', border: '1px solid #ff5c5c', color: confirmClear ? '#fff' : '#ff5c5c' }}>
              <i className="fas fa-trash" /> {confirmClear ? 'Yes, Clear All History' : 'Clear All History'}
            </button>
            {confirmClear && <button className="btn" onClick={() => setConfirmClear(false)} style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '1px solid #aaa', color: '#aaa' }}>Cancel</button>}
          </div>
        </div>

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className={`${styles.ordersPanel} glass-card`}>
            <h3 style={{ marginBottom: '1rem' }}>
              <i className="fas fa-history" /> My Order History
              {socket && <span style={{ fontSize: '11px', color: '#4caf50', marginLeft: '10px', fontWeight: 400 }}>● Live</span>}
            </h3>

            {orders.length === 0 ? (
              <p style={{ color: '#aaa', padding: '10px' }}>No orders yet. Go to <strong>Explore</strong> to find food!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {orders.map(order => {
                  const isExp = !!expanded[order._id]
                  const sColor = STATUS_COLOR[order.status] || '#aaa'
                  const isActive = ['confirmed', 'preparing', 'out_for_delivery'].includes(order.status)
                  return (
                    <div key={order._id} className={styles.orderItem}
                      style={{ border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
                      <div className={styles.orderTop}>
                        <span className={styles.orderId}>Order #{order._id.slice(-4)}</span>
                        <span className={styles.orderStatus} style={{ color: sColor, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isActive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: sColor, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                      </div>
                      <div style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }}>
                        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                          <i className="fas fa-store" /> {order.restaurantId?.restaurantName || 'Restaurant'}
                        </p>
                        {order.items.map((it, idx) => (
                          <p key={idx} className={styles.orderDetail}><b>{it.quantity}x</b> {it.name || 'Item'}</p>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#555' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span style={{ fontWeight: 'bold', color: '#f08804' }}>₹{order.totalAmount}</span>
                      </div>
                      <button
                        onClick={() => setExpanded(p => ({ ...p, [order._id]: !p[order._id] }))}
                        style={{ marginTop: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#aaa', fontSize: '11px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className={`fas fa-${isExp ? 'chevron-up' : 'route'}`} />
                        {isExp ? 'Hide Tracker' : 'Track Order'}
                      </button>
                      {isExp && (
                        <OrderTracker status={order.status} statusHistory={order.statusHistory} estimatedDeliveryTime={order.estimatedDeliveryTime} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <div className={`${styles.ordersPanel} glass-card`}>
            <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-credit-card" /> Payment History</h3>

            {payments.length === 0 ? (
              <p style={{ color: '#aaa', padding: '10px' }}>No payments yet. Place an order from <strong>Explore</strong>!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: '#666', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Invoice #</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Restaurant</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Items</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Mode</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Status</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px', color: '#aaa', fontFamily: 'monospace', fontSize: '11px' }}>{p.invoiceNumber}</td>
                        <td style={{ padding: '12px', color: '#777' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '12px', color: '#ccc' }}>{p.restaurantName || '—'}</td>
                        <td style={{ padding: '12px', color: '#888' }}>
                          {p.items?.slice(0, 2).map(it => `${it.quantity}× ${it.name}`).join(', ')}
                          {p.items?.length > 2 && ` +${p.items.length - 2} more`}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#f08804' }}>₹{p.grandTotal?.toFixed(2)}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '11px' }}>
                          {p.paymentMode === 'card_simulated' ? '💳 Card' : '💵 COD'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ background: `${PAY_COLOR[p.status]}22`, color: PAY_COLOR[p.status], border: `1px solid ${PAY_COLOR[p.status]}44`, borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleViewInvoice(p._id)}
                            style={{ background: 'rgba(240,136,4,0.1)', border: '1px solid rgba(240,136,4,0.3)', borderRadius: '6px', color: '#f08804', fontSize: '11px', padding: '5px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <i className="fas fa-file-invoice" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoice modal */}
      {selectedInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`} role="status">{toast.msg}</div>
    </div>
  )
}
