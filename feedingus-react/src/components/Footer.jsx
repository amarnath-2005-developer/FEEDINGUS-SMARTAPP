import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.logo}>feeding<em>us</em>.com</span>
          <p>Bridging restaurants & users for a seamless food experience.</p>
        </div>
        <div className={styles.linksCol}>
          <h4>Platform</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Login</Link>
        </div>
        <div className={styles.linksCol}>
          <h4>Legal</h4>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Cookie Policy</a>
        </div>
        <div className={styles.linksCol}>
          <h4>Follow Us</h4>
          <div className={styles.socials}>
            <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a>
            <a href="#" aria-label="Twitter"><i className="fab fa-twitter" /></a>
            <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in" /></a>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© 2025 FeedingUs.com — All rights reserved</span>
      </div>
    </footer>
  )
}
