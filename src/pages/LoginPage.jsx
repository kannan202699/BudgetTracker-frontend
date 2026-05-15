import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUser, FiLock, FiEye, FiEyeOff, FiTrendingUp } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'
import toast from 'react-hot-toast'
import API from '../api/axiosConfig'
import { useAuth } from '../context/AuthContext'

const floatingItems = [
  { icon: '💰', x: '10%', y: '15%', delay: 0, size: 28 },
  { icon: '📈', x: '85%', y: '10%', delay: 0.5, size: 32 },
  { icon: '💳', x: '5%', y: '70%', delay: 1, size: 26 },
  { icon: '🏦', x: '90%', y: '65%', delay: 1.5, size: 30 },
  { icon: '💵', x: '20%', y: '85%', delay: 0.8, size: 24 },
  { icon: '📊', x: '75%', y: '80%', delay: 1.2, size: 28 },
  { icon: '💎', x: '50%', y: '5%', delay: 0.3, size: 22 },
  { icon: '🌟', x: '40%', y: '92%', delay: 0.7, size: 20 },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: null })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!formData.username.trim()) newErrors.username = 'Username is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const response = await API.post('/auth/token', {
        username: formData.username.trim(),
        password: formData.password,
      })
      const data = response.data
      if (data.role === 'ADMIN') {
        toast.error('Please use the Admin Login portal')
        setLoading(false)
        return
      }
      login(data)
      toast.success(`Welcome back, ${data.username}!`)
      navigate('/dashboard')
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="user-login-wrapper">
      {/* Animated gradient blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Floating emoji icons */}
      {floatingItems.map((item, i) => (
        <motion.div
          key={i}
          className="floating-icon"
          style={{ left: item.x, top: item.y, fontSize: item.size }}
          animate={{ y: [0, -18, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3.5 + i * 0.3, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}
        >
          {item.icon}
        </motion.div>
      ))}

      {/* Grid pattern overlay */}
      <div className="grid-overlay" />

      <motion.div
        className="user-login-container"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo Section */}
        <div className="login-logo">
          <motion.div
            className="logo-icon"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <FiTrendingUp size={28} />
          </motion.div>
          <span className="logo-text">BudgetPro</span>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <HiSparkles className="sparkle-icon" />
          </motion.div>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to manage your finances smartly</p>

        {/* Stats strip */}
        <div className="stats-strip">
          <div className="stat-item">
            <span className="stat-num">50K+</span>
            <span className="stat-label">Users</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">₹2M+</span>
            <span className="stat-label">Tracked</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">99.9%</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <motion.div className="input-group" initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <label>Username</label>
            <div className={`input-wrap ${errors.username ? 'input-error' : ''}`}>
              <FiUser className="input-icon" />
              <input type="text" name="username" placeholder="Enter your username"
                value={formData.username} onChange={handleChange} autoComplete="username" maxLength={30} />
            </div>
            {errors.username && <span className="field-error-msg">{errors.username}</span>}
          </motion.div>

          <motion.div className="input-group" initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <label>Password</label>
            <div className={`input-wrap ${errors.password ? 'input-error' : ''}`}>
              <FiLock className="input-icon" />
              <input type={showPassword ? 'text' : 'password'} name="password"
                placeholder="Enter your password" value={formData.password}
                onChange={handleChange} autoComplete="current-password" maxLength={100} />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <span className="field-error-msg">{errors.password}</span>}
          </motion.div>

          <motion.button
            type="submit"
            className="login-btn user-login-btn"
            disabled={loading}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {loading ? (
              <div className="btn-loader">
                <div className="spin-ring" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <span>Sign In</span>
                <FiTrendingUp size={18} />
              </>
            )}
          </motion.button>
        </form>

        <motion.p className="switch-role-link" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}>
          New here?{' '}
          <Link to="/register" className="role-link admin-role-link">Create Account →</Link>
        </motion.p>
        <motion.p className="switch-role-link" style={{ marginTop: '8px' }} initial={{ opacity: 0 }}
          animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          Are you an admin?{' '}
          <Link to="/admin/login" className="role-link" style={{ color: '#e94057' }}>Admin Portal →</Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
