import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiTrendingUp, FiTarget, FiPieChart, FiRepeat,
  FiDollarSign, FiFileText, FiArrowRight, FiCheck,
} from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'

const features = [
  {
    icon: <FiTarget size={22} />,
    gradient: 'linear-gradient(135deg,#667eea,#764ba2)',
    shadow: 'rgba(102,126,234,0.35)',
    title: 'Budget Goals',
    desc: 'Set category-wise spending limits and get alerted before you overspend.',
  },
  {
    icon: <FiTrendingUp size={22} />,
    gradient: 'linear-gradient(135deg,#11998e,#38ef7d)',
    shadow: 'rgba(56,239,125,0.25)',
    title: 'Savings Goals',
    desc: 'Track your progress toward emergency funds, trips, and big purchases.',
  },
  {
    icon: <FiPieChart size={22} />,
    gradient: 'linear-gradient(135deg,#f7971e,#ffd200)',
    shadow: 'rgba(247,151,30,0.25)',
    title: 'Smart Analytics',
    desc: 'Visual charts and category breakdowns so you know exactly where money goes.',
  },
  {
    icon: <FiRepeat size={22} />,
    gradient: 'linear-gradient(135deg,#e94057,#8a0a52)',
    shadow: 'rgba(233,64,87,0.25)',
    title: 'Recurring Transactions',
    desc: 'Auto-track subscriptions, rent, and regular payments without manual entry.',
  },
  {
    icon: <FiDollarSign size={22} />,
    gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)',
    shadow: 'rgba(79,172,254,0.25)',
    title: 'EMI Tracker',
    desc: 'Track active loans, view remaining EMIs, and monitor your debt payoff.',
  },
  {
    icon: <FiFileText size={22} />,
    gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    shadow: 'rgba(161,140,209,0.25)',
    title: 'PDF Reports',
    desc: 'Export detailed financial reports for any time period in one click.',
  },
]

const checks = ['Free to use', 'No credit card needed', 'Secure & private']

const floatingItems = [
  { icon: '💰', x: '4%',  y: '18%', delay: 0,   size: 26 },
  { icon: '📈', x: '92%', y: '12%', delay: 0.5, size: 30 },
  { icon: '💳', x: '2%',  y: '72%', delay: 1,   size: 24 },
  { icon: '🏦', x: '93%', y: '68%', delay: 1.5, size: 28 },
  { icon: '💵', x: '18%', y: '88%', delay: 0.8, size: 22 },
  { icon: '📊', x: '80%', y: '84%', delay: 1.2, size: 26 },
  { icon: '💎', x: '50%', y: '4%',  delay: 0.3, size: 20 },
  { icon: '🎯', x: '85%', y: '40%', delay: 0.6, size: 24 },
]

export default function LandingPage() {
  return (
    <div className="landing-wrapper">
      {/* Background */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="grid-overlay" />

      {floatingItems.map((item, i) => (
        <motion.div key={i} className="floating-icon"
          style={{ left: item.x, top: item.y, fontSize: item.size }}
          animate={{ y: [0, -18, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}>
          {item.icon}
        </motion.div>
      ))}

      {/* ── Navbar ── */}
      <motion.nav className="landing-nav"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon"><FiTrendingUp size={20} /></div>
            <span className="logo-text">BudgetPro</span>
            <HiSparkles className="sparkle-icon" style={{ fontSize: 18 }} />
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-nav-signin">Sign In</Link>
            <Link to="/register" className="landing-nav-cta">
              Get Started <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <motion.div className="hero-badge"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <HiSparkles style={{ color: '#ffd200' }} />
          Trusted by 50,000+ users worldwide
        </motion.div>

        <motion.h1 className="hero-headline"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          Master Your Finances,<br />
          <span className="hero-gradient-text">Build Your Future</span>
        </motion.h1>

        <motion.p className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          Track every rupee, set smart budgets, and hit your savings goals —
          all in one beautifully simple dashboard.
        </motion.p>

        <motion.div className="hero-btns"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Link to="/register" className="hero-btn-primary">
            Get Started Free <FiArrowRight size={16} />
          </Link>
          <Link to="/login" className="hero-btn-ghost">
            Already a member? Sign In
          </Link>
        </motion.div>

        <motion.div className="hero-checks"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          {checks.map((c, i) => (
            <span key={i} className="hero-check-item">
              <FiCheck size={13} /> {c}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features-section">
        <motion.div className="section-eyebrow"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          EVERYTHING YOU NEED
        </motion.div>
        <motion.h2 className="section-heading"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          All your finances, one place
        </motion.h2>
        <motion.p className="section-sub"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          Six powerful tools working together to give you complete visibility over your money.
        </motion.p>

        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div key={i} className="feature-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, scale: 1.02 }}>
              <div className="feature-icon"
                style={{ background: f.gradient, boxShadow: `0 8px 20px ${f.shadow}` }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <motion.section className="landing-stats-section"
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="landing-stats-inner">
          {[
            { num: '50K+',  label: 'Active Users' },
            { num: '₹2M+',  label: 'Money Tracked' },
            { num: '99.9%', label: 'Uptime' },
            { num: '6+',    label: 'Finance Tools' },
          ].map((s, i) => (
            <div key={i} className="landing-stat-item">
              <span className="landing-stat-num">{s.num}</span>
              <span className="landing-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Final CTA ── */}
      <motion.section className="landing-cta-section"
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="cta-heading">Ready to take control?</h2>
        <p className="cta-sub">
          Join thousands of people who track smarter, spend less, and save more.
        </p>
        <Link to="/register" className="hero-btn-primary">
          Create Free Account <FiArrowRight size={16} />
        </Link>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>© 2025 BudgetPro · All rights reserved</span>
        <div className="landing-footer-links">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          {/* Admin access — subtle, intentional */}
          <Link to="/admin/login" className="landing-admin-link" tabIndex={-1}>·</Link>
        </div>
      </footer>
    </div>
  )
}
