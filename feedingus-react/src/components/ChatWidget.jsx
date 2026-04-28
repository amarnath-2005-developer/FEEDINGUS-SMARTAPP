import { useState, useRef, useEffect } from 'react'
import styles from './ChatWidget.module.css'

const INITIAL = [{ from: 'bot', text: 'Welcome to FeedingUs! 👋 How can we assist you today?' }]

const BOT_REPLIES = [
  'Great question! Our team will get back to you shortly.',
  'Thanks for reaching out! We typically respond within 24 hours.',
  'We appreciate your message! Check your email for a follow-up.',
  'That\'s important to us — we\'ll look into it right away!',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(INITIAL)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    setMessages(prev => [...prev, { from: 'user', text }])
    setInput('')

    setTimeout(() => {
      const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)]
      setMessages(prev => [...prev, { from: 'bot', text: reply }])
    }, 900)
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          className={styles.fab}
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          id="chat-fab"
        >
          <i className="fas fa-comment-dots" />
        </button>
      )}

      {/* Chat box */}
      {open && (
        <div className={styles.box} role="dialog" aria-label="Support chat">
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.avatar}><i className="fas fa-headset" /></span>
              <div>
                <span className={styles.name}>FeedingUs Support</span>
                <span className={styles.status}><span className={styles.dot} /> Online</span>
              </div>
            </div>
            <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close chat">
              <i className="fas fa-times" />
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.msg} ${msg.from === 'user' ? styles.user : styles.bot}`}>
                {msg.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form className={styles.form} onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              aria-label="Chat message"
              autoFocus
            />
            <button type="submit" aria-label="Send">
              <i className="fas fa-paper-plane" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
