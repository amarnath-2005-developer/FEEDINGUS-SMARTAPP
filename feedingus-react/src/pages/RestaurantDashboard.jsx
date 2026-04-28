import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
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

// What button to show per current status
const NEXT_ACTION = {
  pending:          { label: 'Start Preparing', icon: 'fa-fire', next: 'preparing' },
  confirmed:        { label: 'Start Preparing', icon: 'fa-fire', next: 'preparing' },
  preparing:        { label: 'Out for Delivery', icon: 'fa-motorcycle', next: 'out_for_delivery' },
  out_for_delivery: { label: 'Mark Delivered', icon: 'fa-circle-check', next: 'delivered' },
}

function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function RestaurantDashboard() {
  const { user, logoutUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Main', type: 'veg' })
  const [toast, setToast] = useState({ show: false, msg: '', type: '' })
  const [confirmClear, setConfirmClear] = useState(false)
  const [advancing, setAdvancing] = useState({})
  const [topItems, setTopItems] = useState([])
  const [peakData, setPeakData] = useState([])
  const [totalOrdersStat, setTotalOrdersStat] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      try {
        const menuRes = await api.getMenu()
        setMenuItems(menuRes.items.filter(i => (i.restaurantId?._id || i.restaurantId) === user?._id))
        const ordersRes = await api.getIncomingOrders()
        setOrders(ordersRes.orders)
        
        // Fetch analytics
        const topRes = await api.getTopItems()
        setTopItems(topRes.topItems || [])
        const behaviorRes = await api.getUserBehavior()
        setPeakData(behaviorRes.peakHours || [])
        setTotalOrdersStat(behaviorRes.totalOrders || 0)
      } catch (err) {
        showToast(err.message, 'error')
      }
    }
    loadData()
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000)
  }

  async function advanceStatus(order) {
    const action = NEXT_ACTION[order.status]
    if (!action) return
    setAdvancing(p => ({ ...p, [order._id]: true }))
    try {
      const res = await api.updateOrderStatus(order._id, action.next)
      setOrders(prev => prev.map(o => o._id === order._id ? res.order : o))
      showToast(`Order #${order._id.slice(-4)} → ${STATUS_LABEL[action.next]}`, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setAdvancing(p => ({ ...p, [order._id]: false }))
    }
  }

  async function cancelOrder(id) {
    try {
      const res = await api.updateOrderStatus(id, 'cancelled')
      setOrders(prev => prev.map(o => o._id === id ? res.order : o))
      showToast(`Order #${id.slice(-4)} cancelled`, 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleClearOrders() {
    if (!confirmClear) { setConfirmClear(true); return }
    try {
      await api.clearOrders()
      setOrders([])
      setConfirmClear(false)
      showToast('All orders cleared!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handlePostFood(e) {
    e.preventDefault()
    if (!newItem.name || newItem.price === '') return
    try {
      const res = await api.addMenuItem({ name: newItem.name, price: Number(newItem.price), category: newItem.category, type: newItem.type })
      setMenuItems(prev => [res.item, ...prev])
      setNewItem({ name: '', price: '', category: 'Main', type: 'veg' })
      showToast('Food item posted!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  function logout() { logoutUser(); navigate('/') }

  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const totalOrders = deliveredOrders.length
  const uniqueCustomers = new Set(deliveredOrders.map(o => o.userId?._id)).size

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const currentMonth = new Date().getMonth()
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const m = (currentMonth - 5 + i + 12) % 12
    return { month: monthNames[m], orders: 0 }
  })
  deliveredOrders.forEach(o => {
    const m = new Date(o.createdAt).getMonth()
    const d = chartData.find(c => c.month === monthNames[m])
    if (d) d.orders += 1
  })

  // Group by active vs. done
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <span className={styles.restaurantBadge}><i className="fas fa-utensils" /></span>
          <div>
            <h1 className={styles.restaurantName}>{user?.restaurantName || user?.name || 'Restaurant'}</h1>
            <p className={styles.restaurantMeta}>
              <i className="fas fa-location-dot" /> {user?.restaurantLocation || 'Unknown Location'}
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <i className="fas fa-id-badge" /> #{user?._id?.slice(-5) || '00000'}
            </p>
          </div>
        </div>
        <button className="btn" id="logout-btn" onClick={logout}><i className="fas fa-right-from-bracket" />&nbsp;Logout</button>
      </div>

      <div className={styles.statsRow}>
        {[
          { icon: 'fa-chart-line', label: 'LifeTime Orders', val: totalOrdersStat.toString() },
          { icon: 'fa-clock', label: 'Active Orders', val: activeOrders.length.toString() },
          { icon: 'fa-users', label: 'Customers', val: uniqueCustomers.toString() },
        ].map((s, i) => (
          <div key={i} className={`${styles.statCard} glass-card`}>
            <i className={`fas ${s.icon}`} />
            <div>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          {/* Peak Hours Chart */}
          <div className={`${styles.chartBox} glass-card`}>
            <h3><i className="fas fa-clock" /> Peak Order Hours</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Distribution of orders by hour of day (24h format)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={peakData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="hour" stroke="#aaa" tick={{ fontSize: 10 }} />
                <YAxis stroke="#aaa" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(240,136,4,0.4)', borderRadius: 8, color: '#fff' }} 
                />
                <Bar dataKey="count" fill="#f08804" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Items Leaderboard */}
          <div className={`${styles.chartBox} glass-card`} style={{ marginTop: '24px' }}>
            <h3><i className="fas fa-trophy" /> Top Performing Items</h3>
            <div style={{ marginTop: '15px' }}>
              {topItems.length === 0 ? (
                <p style={{ color: '#555', fontSize: '13px' }}>Not enough data yet.</p>
              ) : (
                topItems.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: idx < topItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ width: '24px', height: '24px', background: idx === 0 ? '#f08804' : 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '11px', fontWeight: 700, color: idx === 0 ? '#000' : '#aaa' }}>{idx + 1}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#eee' }}>{it.itemName}</p>
                      <p style={{ fontSize: '11px', color: '#666' }}>{it.itemType}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#f08804' }}>{it.totalOrders}</p>
                      <p style={{ fontSize: '10px', color: '#555' }}>Orders</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Menu */}
          <div className={`${styles.menuBox} glass-card`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}><i className="fas fa-book-open" /> My Menu Items</h3>
            </div>
            <form onSubmit={handlePostFood} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Food Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#111', color: '#fff' }} required />
              <input type="number" placeholder="Price ($)" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#111', color: '#fff' }} required />
              <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #333', background: '#111', color: '#fff' }}>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
              <button type="submit" className="btn" style={{ padding: '8px 16px', fontSize: '13px' }}>Post</button>
            </form>
            <div className={styles.menuGrid}>
              {menuItems.length === 0
                ? <p style={{ color: '#aaa', padding: '10px' }}>No menu items yet.</p>
                : menuItems.map(item => (
                  <div key={item._id} className={styles.menuItem}>
                    <span className={styles.menuName}>{item.name}</span>
                    <span className={styles.menuPrice}>${item.price}</span>
                    <span className={`${styles.menuTag} ${item.type === 'veg' ? styles.veg : styles.nonVeg}`}>
                      {item.type === 'veg' ? 'Veg' : 'Non-Veg'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right column - Orders */}
        <div className={`${styles.ordersPanel} glass-card`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}><i className="fas fa-receipt" /> Incoming Orders</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {confirmClear && <span style={{ fontSize: '12px', color: '#ff5c5c' }}>Are you sure?</span>}
              <button className="btn" onClick={handleClearOrders} style={{ padding: '6px 12px', fontSize: '12px', background: confirmClear ? '#ff5c5c' : 'transparent', border: '1px solid #ff5c5c', color: confirmClear ? '#fff' : '#ff5c5c' }}>
                <i className="fas fa-trash" /> {confirmClear ? 'Yes, Clear All' : 'Clear All'}
              </button>
              {confirmClear && <button className="btn" onClick={() => setConfirmClear(false)} style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '1px solid #aaa', color: '#aaa' }}>Cancel</button>}
            </div>
          </div>

          <div className={styles.ordersList}>
            {orders.length === 0 && <p style={{ color: '#aaa', padding: '10px' }}>No incoming orders.</p>}

            {/* Active orders */}
            {activeOrders.map(order => {
              const action = NEXT_ACTION[order.status]
              const sColor = STATUS_COLOR[order.status] || '#aaa'
              const lastHistory = order.statusHistory?.[order.statusHistory.length - 1]
              return (
                <div key={order._id} className={styles.orderItem} style={{ borderLeft: `3px solid ${sColor}` }}>
                  <div className={styles.orderTop}>
                    <span className={styles.orderId}>#{order._id.slice(-4)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: sColor, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                      <span className={styles.orderStatus} style={{ color: sColor }}>{STATUS_LABEL[order.status]}</span>
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: '#555', margin: '2px 0 6px' }}>
                    <i className="fas fa-user" /> {order.userId?.name || 'Customer'}
                    {lastHistory && <span style={{ marginLeft: 8 }}>· {formatTime(lastHistory.timestamp)}</span>}
                  </p>

                  {order.items.map((it, idx) => (
                    <p key={idx} className={styles.orderDetail}><b>{it.quantity}x</b> {it.name || 'Item'}</p>
                  ))}

                  {/* Status history mini-timeline */}
                  {order.statusHistory?.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {order.statusHistory.map((h, i) => (
                        <span key={i} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '2px 6px', color: '#777' }}>
                          {STATUS_LABEL[h.status] || h.status} {formatTime(h.timestamp)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {action && (
                      <button
                        className="btn"
                        id={`advance-order-${order._id}`}
                        disabled={advancing[order._id]}
                        style={{ padding: '7px 14px', fontSize: '12px', flex: 1 }}
                        onClick={() => advanceStatus(order)}
                      >
                        <i className={`fas ${action.icon}`} /> {advancing[order._id] ? '...' : action.label}
                      </button>
                    )}
                    {!['delivered', 'cancelled'].includes(order.status) && (
                      <button
                        onClick={() => cancelOrder(order._id)}
                        style={{ padding: '7px 10px', fontSize: '12px', background: 'transparent', border: '1px solid #ff5c5c', color: '#ff5c5c', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <i className="fas fa-times" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Past orders (collapsed) */}
            {pastOrders.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Completed / Cancelled
                </p>
                {pastOrders.map(order => (
                  <div key={order._id} className={styles.orderItem} style={{ opacity: 0.55, borderLeft: `3px solid ${STATUS_COLOR[order.status]}` }}>
                    <div className={styles.orderTop}>
                      <span className={styles.orderId}>#{order._id.slice(-4)}</span>
                      <span className={styles.orderStatus} style={{ color: STATUS_COLOR[order.status] }}>{STATUS_LABEL[order.status]}</span>
                    </div>
                    {order.items.map((it, idx) => (
                      <p key={idx} className={styles.orderDetail}><b>{it.quantity}x</b> {it.name || 'Item'}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`} role="status">{toast.msg}</div>
    </div>
  )
}
