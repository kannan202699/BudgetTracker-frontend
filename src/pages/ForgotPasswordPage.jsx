import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiTrendingUp, FiArrowLeft } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'
import toast from 'react-hot-toast'
import API from '../api/axiosConfig'

const floatingItems = [
  { icon: '💰', x: '10%', y: '15%', delay: 0, size: 28 },
  { icon: '📈', x: '85%', y: '10%', delay: 0.5, size: 32 },
  { icon: '💳', x: '5%', y: '70%', delay: 1, size: 26 },
  { icon: '🏦', x: '90%', y: '65%', delay: 1.5, size: 30 },
  { icon: '💵', x: '20%', y: '85%', delay: 0.8, size: 24 },
  { icon: '📊', x: '75%', y: '80%', delay: 1.2, size: 28 },
]

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [emailError, setEmailError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Enter a valid email address'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }

    setLoading(true)
    try {
      await API.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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

        {sent ? (
          <motion.div className="fp-success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}>
            <span className="fp-success-icon">📧</span>
            <p className="fp-success-title">Check your inbox</p>
            <p className="fp-success-text">
              We've sent a password reset link to <strong style={{ color: '#a78bfa' }}>{email}</strong>.
              The link is valid for 15 minutes.
            </p>
            <p className="fp-success-text" style={{ marginTop: 12, fontSize: 13 }}>
              Didn't receive it? Check your spam folder, or{' '}
              <button className="fp-resend-btn" onClick={() => setSent(false)}>try again</button>.
            </p>
            <Link to="/login" className="role-link admin-role-link"
              style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 14 }}>
              <FiArrowLeft style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Back to Sign In
            </Link>
          </motion.div>
        ) : (
          <>
            <h1 className="login-title">Forgot Password?</h1>
            <p className="login-subtitle">Enter your registered email and we'll send you a reset link.</p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <motion.div className="input-group" initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <label>Email Address</label>
                <div className={`input-wrap ${emailError ? 'input-error' : ''}`}>
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null) }}
                    autoComplete="email"
                    maxLength={100}
                  />
                </div>
                {emailError && <span className="field-error-msg">{emailError}</span>}
              </motion.div>

              <motion.button type="submit" className="login-btn user-login-btn" disabled={loading}
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                {loading ? (
                  <div className="btn-loader"><div className="spin-ring" /><span>Sending link...</span></div>
                ) : (
                  <><FiMail size={17} /><span>Send Reset Link</span></>
                )}
              </motion.button>
            </form>

            <motion.p className="switch-role-link" style={{ marginTop: 20 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Link to="/login" className="role-link admin-role-link">
                <FiArrowLeft style={{ verticalAlign: 'middle', marginRight: 4 }} />Back to Sign In
              </Link>
            </motion.p>
          </>
        )}
      </motion.div>
    </div>
  )
}
