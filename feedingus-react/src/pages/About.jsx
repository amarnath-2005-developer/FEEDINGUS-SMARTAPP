import styles from './About.module.css'

const SERVICES = [
  {
    icon: 'fa-utensils',
    title: 'Restaurant Dashboard',
    desc: 'Restaurants can manage menus, track surplus food, schedule donations, and view analytics to optimize their contributions with real-time insights.',
  },
  {
    icon: 'fas fa-user',
    title: 'User Dashboard',
    desc: 'Users can browse available food, coordinate pickups, track their orders, and connect with local restaurants efficiently.',
  },
  {
    icon: 'fa-shield-halved',
    title: 'Admin Portal',
    desc: 'Administrators oversee all platform activities, verify users, manage disputes, and ensure smooth operations across the entire network.',
  },
  {
    icon: 'fa-bell',
    title: 'Notification Service',
    desc: 'Real-time notifications about donation statuses, new opportunities, and platform updates keep all users connected and engaged.',
  },
  {
    icon: 'fa-lock',
    title: 'Secure Authentication',
    desc: 'Secure user authentication ensures only verified restaurants and users access the platform, maintaining trust and safety for all.',
  },
  {
    icon: 'fa-boxes-stacking',
    title: 'Donation Management',
    desc: 'Track every step of the donation process from scheduling to delivery, providing full transparency and accountability for all parties.',
  },
]

const STATS = [
  { num: '500+', label: 'Registered Restaurants' },
  { num: '340+', label: 'Active Users' },
  { num: '12k+', label: 'Meals Delivered' },
  { num: '12', label: 'Cities Covered' },
]

export default function About() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>About <span>FeedingUs</span></h1>
          <p>We're on a mission to end food waste and hunger — one restaurant at a time.</p>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.mission}>
        <div className={styles.missionGrid}>
          <div className={`${styles.missionCard} glass-card`}>
            <i className="fas fa-bullseye" />
            <h2>Our Mission</h2>
            <p>
              FeedingUs bridges the gap between restaurants and users, fostering a seamless
              ecosystem for food distribution and discovery. We empower restaurants to manage their surplus and
              enable users to easily explore and request it.
            </p>
          </div>
          <div className={`${styles.missionCard} glass-card`}>
            <i className="fas fa-gears" />
            <h2>How We Work</h2>
            <p>
              Our intuitive dashboard tools allow all users to oversee their operations,
              track orders, and ensure transparency. By connecting restaurants with local food lovers,
              we build a stronger, more connected community.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        {STATS.map((s, i) => (
          <div key={i} className={styles.statItem}>
            <span className={styles.statNum}>{s.num}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* Services Grid */}
      <section className={styles.services}>
        <h2 className="section-title">Our Services</h2>
        <p className="section-sub">A full suite of tools to power the future of food donation</p>
        <div className={styles.grid}>
          {SERVICES.map((s, i) => (
            <div key={i} className={`${styles.card} glass-card`}>
              <div className={styles.cardIcon}>
                <i className={`fas ${s.icon}`} />
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
