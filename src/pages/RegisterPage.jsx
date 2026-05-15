import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUser, FiLock, FiEye, FiEyeOff, FiTrendingUp, FiUserPlus, FiCheck, FiX } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'
import toast from 'react-hot-toast'
import API from '../api/axiosConfig'
import { validateUsername, validatePassword, getPasswordStrength, getPasswordChecks } from '../utils/validators'

const floatingItems = [
  { icon: '💰', x: '10%', y: '15%', delay: 0, size: 28 },
  { icon: '📈', x: '85%', y: '10%', delay: 0.5, size: 32 },
  { icon: '💳', x: '5%', y: '70%', delay: 1, size: 26 },
  { icon: '🏦', x: '90%', y: '65%', delay: 1.5, size: 30 },
  { icon: '💵', x: '20%', y: '85%', delay: 0.8, size: 24 },
  { icon: '📊', x: '75%', y: '80%', delay: 1.2, size: 28 },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(formData.password)
  const checks = getPasswordChecks(formData.password)

  const validate = (name, value) => {
    if (name === 'username') return validateUsername(value)
    if (name === 'password') return validatePassword(value, true)
    if (name === 'confirmPassword') return value !== formData.password ? 'Passwords do not match' : null
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, value) }))
    }
    // Re-validate confirmPassword when password changes
    if (name === 'password' && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: formData.confirmPassword !== value ? 'Passwords do not match' : null,
      }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const allTouched = { username: true, password: true, confirmPassword: true }
    setTouched(allTouched)
    const newErrors = {
      username: validate('username', formData.username),
      password: validate('password', formData.password),
      confirmPassword: formData.confirmPassword !== formData.password ? 'Passwords do not match' : null,
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    setLoading(true)
    try {
      await API.post('/auth/register/user', {
        username: formData.username.trim(),
        password: formData.password,
      })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const reqItem = (met, label) => (
    <li className={`pw-req-item ${met ? 'pw-req-met' : 'pw-req-unmet'}`}>
      {met ? <FiCheck size={11} /> : <FiX size={11} />} {label}
    </li>
  )

  return (
    <div className="user-login-wrapper">
      <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
      {floatingItems.map((item, i) => (
        <motion.div key={i} className="floating-icon"
          style={{ left: item.x, top: item.y, fontSize: item.size }}
          animate={{ y: [0, -18, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3.5 + i * 0.3, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}>
          {item.icon}
        </motion.div>
      ))}
      <div className="grid-overlay" />

      <motion.div className="user-login-container"
        initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}>

        <div className="login-logo">
          <motion.div className="logo-icon" animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
            <FiTrendingUp size={28} />
          </motion.div>
          <span className="logo-text">BudgetPro</span>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
            <HiSparkles className="sparkle-icon" />
          </motion.div>
        </div>

        <h1 className="login-title">Create Account</h1>
        <p className="login-subtitle">Start tracking your finances today</p>

        <form className="login-form" onSubmit={handleRegister} noValidate>
          {/* Username */}
          <motion.div className="input-group" initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <label>Username</label>
            <div className={`input-wrap ${touched.username && errors.username ? 'input-error' : ''}`}>
              <FiUser className="input-icon" />
              <input type="text" name="username" placeholder="3-30 chars, letters/numbers/underscore"
                value={formData.username} onChange={handleChange} onBlur={handleBlur}
                autoComplete="username" maxLength={30} />
            </div>
            {touched.username && errors.username && (
              <span className="field-error-msg">{errors.username}</span>
            )}
          </motion.div>

          {/* Password */}
          <motion.div className="input-group" initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <label>Password</label>
            <div className={`input-wrap ${touched.password && errors.password ? 'input-error' : ''}`}>
              <FiLock className="input-icon" />
              <input type={showPassword ? 'text' : 'password'} name="password"
                placeholder="Min 8 chars with upper, lower, number, symbol"
                value={formData.password} onChange={handleChange} onBlur={handleBlur}
                autoComplete="new-password" maxLength={100} />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Password strength bar */}
            {formData.password && (
              <div className="pw-strength-wrap">
                <div className="pw-strength-bar">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="pw-strength-seg"
                      style={{ background: strength.score >= i ? strength.color : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <span className="pw-strength-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}

            {/* Requirements checklist */}
            {formData.password && (
              <ul className="pw-req-list">
                {reqItem(checks.length,  '8+ characters')}
                {reqItem(checks.upper,   'Uppercase letter')}
                {reqItem(checks.lower,   'Lowercase letter')}
                {reqItem(checks.digit,   'Number')}
                {reqItem(checks.special, 'Special character (!@#$ etc.)')}
              </ul>
            )}

            {touched.password && errors.password && !formData.password && (
              <span className="field-error-msg">{errors.password}</span>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div className="input-group" initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
            <label>Confirm Password</label>
            <div className={`input-wrap ${touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''}`}>
              <FiLock className="input-icon" />
              <input type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                placeholder="Re-enter your password" value={formData.confirmPassword}
                onChange={handleChange} onBlur={handleBlur}
                autoComplete="new-password" maxLength={100} />
              <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="field-error-msg">{errors.confirmPassword}</span>
            )}
          </motion.div>

          <motion.button type="submit" className="login-btn user-login-btn" disabled={loading}
            whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {loading ? (
              <div className="btn-loader"><div className="spin-ring" /><span>Creating account...</span></div>
            ) : (
              <><FiUserPlus size={18} /><span>Create Account</span></>
            )}
          </motion.button>
        </form>

        <motion.p className="switch-role-link" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}>
          Already have an account?{' '}
          <Link to="/login" className="role-link admin-role-link">Sign In →</Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
