import styles from './InvoiceModal.module.css'

export default function InvoiceModal({ invoice, onClose }) {
  if (!invoice) return null

  const {
    invoiceNumber, createdAt, paidAt, paymentMode, status,
    items, subtotal, gstRate, gstAmount, deliveryFee, discount, grandTotal,
    restaurantName, userId,
  } = invoice

  function handlePrint() {
    window.print()
  }

  const modeLabel = paymentMode === 'card_simulated' ? 'Card (Simulated)' : 'Cash on Delivery'
  const statusColor = status === 'paid' ? '#4caf50' : status === 'failed' ? '#ff5c5c' : '#f08804'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Toolbar (hidden in print) */}
        <div className={styles.toolbar}>
          <button className={styles.printBtn} onClick={handlePrint}>
            <i className="fas fa-print" /> Print / Save PDF
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* ── Invoice body (this part gets printed) ── */}
        <div className={styles.invoice} id="invoice-print-area">
          {/* Brand header */}
          <div className={styles.brand}>
            <div className={styles.brandLogo}>🍽️</div>
            <div>
              <h1 className={styles.brandName}>FeedingUs</h1>
              <p className={styles.brandTagline}>Good Food, Good Cause</p>
            </div>
            <div className={styles.invoiceMeta}>
              <span className={styles.invoiceNumber}>{invoiceNumber}</span>
              <span className={styles.invoiceDate}>
                {new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* From / To */}
          <div className={styles.parties}>
            <div>
              <p className={styles.partyLabel}>From</p>
              <p className={styles.partyName}>{restaurantName || 'Restaurant'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className={styles.partyLabel}>To</p>
              <p className={styles.partyName}>{userId?.name || 'Customer'}</p>
              {userId?.email && <p className={styles.partyEmail}>{userId.email}</p>}
            </div>
          </div>

          {/* Payment info row */}
          <div className={styles.infoRow}>
            <span>Payment Mode: <strong>{modeLabel}</strong></span>
            <span style={{ color: statusColor, fontWeight: 700, textTransform: 'capitalize' }}>
              ● {status}
            </span>
            {paidAt && (
              <span style={{ color: '#aaa' }}>
                Paid: {new Date(paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Line items table */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{it.name}</td>
                  <td>{it.quantity}</td>
                  <td>₹{it.unitPrice?.toFixed(2)}</td>
                  <td>₹{it.lineTotal?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Billing breakdown */}
          <div className={styles.totals}>
            <div className={styles.totalRow}><span>Subtotal</span><span>₹{subtotal?.toFixed(2)}</span></div>
            <div className={styles.totalRow}>
              <span>GST ({((gstRate || 0.18) * 100).toFixed(0)}%)</span>
              <span>₹{gstAmount?.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}><span>Delivery Fee</span><span>₹{deliveryFee?.toFixed(2)}</span></div>
            {discount > 0 && (
              <div className={styles.totalRow} style={{ color: '#4caf50' }}>
                <span>Discount</span><span>−₹{discount?.toFixed(2)}</span>
              </div>
            )}
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Grand Total</span><span>₹{grandTotal?.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.footer}>
            <p>Thank you for supporting FeedingUs! 🙏</p>
            <p style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>
              This is a computer-generated invoice and does not require a signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
