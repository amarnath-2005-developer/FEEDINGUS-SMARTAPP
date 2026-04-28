import { useState, useEffect } from 'react'
import styles from './OrderTracker.module.css'

const STEPS = [
  { key: 'confirmed',        label: 'Confirmed',        icon: '✅' },
  { key: 'preparing',        label: 'Preparing',        icon: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
  { key: 'delivered',        label: 'Delivered',        icon: '🎉' },
]

const STATUS_ORDER = ['confirmed', 'preparing', 'out_for_delivery', 'delivered']

// Legacy support: treat 'pending' as 'confirmed'
function normalizeStatus(status) {
  return status === 'pending' ? 'confirmed' : status
}

function getStepIndex(status) {
  const normalized = normalizeStatus(status)
  const idx = STATUS_ORDER.indexOf(normalized)
  return idx === -1 ? 0 : idx
}

function formatTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getHistoryTimestamp(statusHistory, stepKey) {
  if (!statusHistory) return null
  const legacy = stepKey === 'confirmed' ? ['confirmed', 'pending'] : [stepKey]
  const entry = [...statusHistory].reverse().find(h => legacy.includes(h.status))
  return entry?.timestamp || null
}

/**
 * CountdownTimer — ticks every second toward estimatedDeliveryTime
 */
function CountdownTimer({ estimatedDeliveryTime, status }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!estimatedDeliveryTime) return
    if (['delivered', 'cancelled'].includes(status)) return

    function tick() {
      const diff = new Date(estimatedDeliveryTime) - new Date()
      setRemaining(diff > 0 ? diff : 0)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [estimatedDeliveryTime, status])

  if (status === 'delivered' || status === 'cancelled') return null
  if (remaining === null) return null

  if (remaining <= 0) {
    return <span className={styles.etaBadge} style={{ background: '#4caf5033', color: '#4caf50' }}>🎉 Arriving now!</span>
  }

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return (
    <span className={styles.etaBadge}>
      ⏱ ETA {mins}m {secs}s
    </span>
  )
}

/**
 * OrderTracker — animated step progress tracker
 */
export default function OrderTracker({ status, statusHistory, estimatedDeliveryTime }) {
  const currentIndex = getStepIndex(status)
  const isCancelled = status === 'cancelled'

  if (isCancelled) {
    return (
      <div className={styles.cancelledBanner}>
        <span>❌</span>
        <span>Order Cancelled</span>
        {statusHistory?.find(h => h.status === 'cancelled') && (
          <span className={styles.cancelTime}>
            at {formatTime(statusHistory.find(h => h.status === 'cancelled').timestamp)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={styles.tracker}>
      <div className={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex
          const isActive = idx === currentIndex
          const ts = getHistoryTimestamp(statusHistory, step.key)

          return (
            <div key={step.key} className={styles.stepWrap}>
              {/* Connector line before this step */}
              {idx > 0 && (
                <div className={`${styles.connector} ${isDone || isActive ? styles.connectorDone : ''}`} />
              )}

              <div className={`${styles.step} ${isDone ? styles.done : ''} ${isActive ? styles.active : ''}`}>
                <div className={`${styles.circle} ${isDone ? styles.circleDone : ''} ${isActive ? styles.circleActive : ''}`}>
                  {isDone ? '✓' : step.icon}
                  {isActive && <span className={styles.pulse} />}
                </div>
                <span className={styles.stepLabel}>{step.label}</span>
                {ts && (
                  <span className={styles.stepTime}>
                    {formatDate(ts)} {formatTime(ts)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <CountdownTimer estimatedDeliveryTime={estimatedDeliveryTime} status={status} />
    </div>
  )
}
