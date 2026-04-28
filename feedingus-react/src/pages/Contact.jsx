import { useState } from 'react'
import styles from './Contact.module.css'

const OFFICES = [
  { city: 'New York', addr: '123 Food Bridge St, New York, NY 10001' },
  { city: 'Los Angeles', addr: '456 Food Ave, Los Angeles, CA 90001' },
  { city: 'Chicago', addr: '789 Hunger Relief Rd, Chicago, IL 60601' },
  { city: 'Miami', addr: '101 Donation Dr, Miami, FL 33101' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [toast, setToast] = useState({ show: false, msg: '', type: '' })

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000)
  }

  function handleSubmit(e) {
    e.preventDefault()
    showToast('Message sent! We\'ll get back to you within 24 hours.', 'success')
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1>Contact <span>Us</span></h1>
        <p>We're here to help. Reach out via email, phone, or visit one of our offices.</p>
      </section>

      {/* Contact Details */}
      <section className={styles.details}>
        <div className={`${styles.detailCard} glass-card`}>
          <i className="fas fa-envelope" />
          <h3>Email</h3>
          <a href="mailto:support@feedingus.com">support@feedingus.com</a>
        </div>
        <div className={`${styles.detailCard} glass-card`}>
          <i className="fas fa-phone" />
          <h3>Phone</h3>
          <a href="tel:+18005551234">+1-800-555-1234</a>
        </div>
        <div className={`${styles.detailCard} glass-card`}>
          <i className="fas fa-clock" />
          <h3>Hours</h3>
          <span>Mon–Fri, 9 AM – 6 PM EST</span>
        </div>
      </section>

      {/* Offices */}
      <section className={styles.offices}>
        <h2 className="section-title">Our Offices</h2>
        <p className="section-sub">Find us in cities across the United States</p>
        <div className={styles.officeGrid}>
          {OFFICES.map((o, i) => (
            <div key={i} className={`${styles.officeCard} glass-card`}>
              <i className="fas fa-location-dot" />
              <h3>{o.city}</h3>
              <p>{o.addr}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className={styles.formSection}>
        <div className={styles.formWrap}>
          <h2 className="section-title">Send a Message</h2>
          <p className="section-sub">Fill out the form and we'll respond promptly</p>
          <form className={styles.form} id="contact-form" onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <div className="form-group">
                <label htmlFor="c-name">Full Name</label>
                <input id="c-name" type="text" placeholder="John Doe" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label htmlFor="c-email">Email</label>
                <input id="c-email" type="email" placeholder="john@example.com" required
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="c-subject">Subject</label>
              <input id="c-subject" type="text" placeholder="How can we help?" required
                value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="c-message">Message</label>
              <textarea id="c-message" placeholder="Write your message here…" rows={5} required
                value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            </div>
            <button type="submit" className="btn" id="contact-submit">
              <i className="fas fa-paper-plane" /> &nbsp;Send Message
            </button>
          </form>
        </div>
      </section>

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`} role="status">{toast.msg}</div>
    </div>
  )
}
