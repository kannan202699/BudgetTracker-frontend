import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiShield, FiLock, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi'
import { MdAdminPanelSettings, MdSecurity } from 'react-icons/md'
import { HiFingerPrint } from 'react-icons/hi'
import toast from 'react-hot-toast'
import API from '../api/axiosConfig'
import { useAuth } from '../context/AuthContext'

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 3,
  duration: Math.random() * 4 + 3,
}))

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authStep, setAuthStep] = useState(1)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!formData.username || !formData.password) {
      toast.error('Credentials required')
      return
    }
    setLoading(true)
    setAuthStep(2)
    try {
      await new Promise((res) => setTimeout(res, 800))
      const response = await API.post('/auth/token', formData)
      const data = response.data
      const role = data.role?.replace(/^ROLE_/, '') ?? data.role
      if (role !== 'ADMIN') {
        toast.error('Access denied. Admin privileges required.')
        setLoading(false)
        setAuthStep(1)
        return
      }
      setAuthStep(3)
      await new Promise((res) => setTimeout(res, 600))
      login({ ...data, role })
      toast.success(`Admin access granted. Welcome, ${data.username}!`)
      navigate('/admin/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed')
      setAuthStep(1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-wrapper">
      {/* Particle field */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="admin-particle"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        />
      ))}

      {/* Hexagon grid pattern */}
      <div className="hex-grid" />

      {/* Scanline effect */}
      <motion.div
        className="scanline"
        animate={{ top: ['-5%', '105%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      <div className="admin-login-layout">
        {/* Left panel - branding */}
        <motion.div
          className="admin-brand-panel"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="admin-brand-content">
            <motion.div
              className="admin-shield"
              animate={{ rotateY: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <MdAdminPanelSettings size={80} />
            </motion.div>
            <h2 className="brand-headline">Admin Control Center</h2>
            <p className="brand-desc">
              Secure management portal for authorized administrators only.
              All actions are logged and monitored.
            </p>

            <div className="security-badges">
              <div className="sec-badge">
                <MdSecurity size={16} /> <span>256-bit SSL</span>
              </div>
              <div className="sec-badge">
                <HiFingerPrint size={16} /> <span>JWT Auth</span>
              </div>
              <div className="sec-badge">
                <FiShield size={16} /> <span>Role Based</span>
              </div>
            </div>

            <div className="admin-stats-panel">
              <div className="admin-stat">
                <span className="admin-stat-num">100%</span>
                <span className="admin-stat-lbl">Secure</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-num">24/7</span>
                <span className="admin-stat-lbl">Monitored</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-num">∞</span>
                <span className="admin-stat-lbl">Control</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right panel - form */}
        <motion.div
          className="admin-form-panel"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="admin-login-card">
            {/* Header */}
            <div className="admin-card-header">
              <div className="admin-logo">
                <FiShield size={22} />
              </div>
              <div>
                <h1 className="admin-login-title">Admin Portal</h1>
                <p className="admin-login-sub">BudgetPro Management System</p>
              </div>
            </div>

            {/* Auth steps indicator */}
            <div className="auth-steps">
              {['Credentials', 'Verify', 'Access'].map((step, i) => (
                <div key={i} className={`auth-step ${authStep > i ? 'step-done' : authStep === i + 1 ? 'step-active' : ''}`}>
                  <div className="step-dot">{authStep > i + 1 ? '✓' : i + 1}</div>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            {/* Warning banner */}
            <motion.div
              className="admin-warning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <FiAlertTriangle size={14} />
              <span>Authorized personnel only. Unauthorized access is prohibited.</span>
            </motion.div>

            <form onSubmit={handleLogin} className="admin-form">
              <motion.div
                className="input-group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label>Administrator ID</label>
                <div className="admin-input-wrap">
                  <MdAdminPanelSettings className="input-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter admin username"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
              </motion.div>

              <motion.div
                className="input-group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label>Security Password</label>
                <div className="admin-input-wrap">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter secure password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                type="submit"
                className="login-btn admin-login-btn"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {loading ? (
                  <div className="btn-loader">
                    <div className="spin-ring admin-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <FiShield size={18} />
                    <span>Secure Sign In</span>
                  </>
                )}
              </motion.button>
            </form>

            <p className="switch-role-link" style={{ marginTop: '20px' }}>
              Regular user?{' '}
              <Link to="/login" className="role-link user-role-link">
                ← User Portal
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
