import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiLock, FiEye, FiEyeOff, FiTrendingUp, FiCheck, FiX } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'
import toast from 'react-hot-toast'
import API from '../api/axiosConfig'
import { validatePassword, getPasswordStrength, getPasswordChecks } from '../utils/validators'

const floatingItems = [
  { icon: '🔐', x: '10%', y: '15%', delay: 0, size: 28 },
  { icon: '🛡️', x: '85%', y: '10%', delay: 0.5, size: 32 },
  { icon: '💰', x: '5%', y: '70%', delay: 1, size: 26 },
  { icon: '🏦', x: '90%', y: '65%', delay: 1.5, size: 30 },
  { icon: '📊', x: '75%', y: '80%', delay: 1.2, size: 28 },
]

export default function ResetPasswordPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token')

  const [formData, setFormData]     = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors]         = useState({})
  const [touched, setTouched]       = useState({})
  const [showPw, setShowPw]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]       = useState(false)

  const strength = getPasswordStrength(formData.password)
  const checks   = getPasswordChecks(formData.password)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset link. Please request a new one.')
      navigate('/forgot-password', { replace: true })
    }
  }, [token, navigate])

  const validate = (name, value) => {
    if (name === 'password') return validatePassword(value, true)
    if (name === 'confirmPassword') return value !== formData.password ? 'Passwords do not match' : null
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
    if (name === 'password' && touched.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: formData.confirmPassword !== value ? 'Passwords do not match' : null,
      }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ password: true, confirmPassword: true })
    const newErrors = {
      password:        validate('password', formData.password),
      confirmPassword: formData.confirmPassword !== formData.password ? 'Passwords do not match' : null,
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    setLoading(true)
    try {
      await API.post('/auth/reset-password', { token, newPassword: formData.password })
      toast.success('Password reset! Please sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.')
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

        <h1 className="login-title">Set New Password</h1>
        <p className="login-subtitle">Choose a strong password to protect your account.</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <motion.div className="input-group" initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <label>New Password</label>
            <div className={`input-wrap ${touched.password && errors.password ? 'input-error' : ''}`}>
              <FiLock className="input-icon" />
              <input type={showPw ? 'text' : 'password'} name="password"
                placeholder="Min 8 chars — upper, lower, number, symbol"
                value={formData.password} onChange={handleChange} onBlur={handleBlur}
                autoComplete="new-password" maxLength={100} />
              <button type="button" className="eye-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

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
            {formData.password && (
              <ul className="pw-req-list">
                {reqItem(checks.length,  '8+ characters')}
                {reqItem(checks.upper,   'Uppercase letter')}
                {reqItem(checks.lower,   'Lowercase letter')}
                {reqItem(checks.digit,   'Number')}
                {reqItem(checks.special, 'Special character')}
              </ul>
            )}
            {touched.password && errors.password && !formData.password && (
              <span className="field-error-msg">{errors.password}</span>
            )}
          </motion.div>

          {/* Confirm */}
          <motion.div className="input-group" initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <label>Confirm New Password</label>
            <div className={`input-wrap ${touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''}`}>
              <FiLock className="input-icon" />
              <input type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                placeholder="Re-enter your new password" value={formData.confirmPassword}
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
              <div className="btn-loader"><div className="spin-ring" /><span>Resetting...</span></div>
            ) : (
              <><FiLock size={17} /><span>Reset Password</span></>
            )}
          </motion.button>
        </form>

        <motion.p className="switch-role-link" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}>
          <Link to="/login" className="role-link admin-role-link">Back to Sign In →</Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
