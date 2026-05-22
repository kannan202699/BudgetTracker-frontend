import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiUser, FiLock, FiEye, FiEyeOff, FiTrendingUp,
  FiUserPlus, FiCheck, FiX, FiMail, FiPhone, FiArrowRight,
} from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi'
import toast from 'react-hot-toast'
import API from '../api/axiosConfig'
import {
  validateUsername, validatePassword, validateEmail, validatePhone,
  getPasswordStrength, getPasswordChecks,
} from '../utils/validators'

const floatingItems = [
  { icon: '💰', x: '10%', y: '15%', delay: 0,   size: 28 },
  { icon: '📈', x: '85%', y: '10%', delay: 0.5, size: 32 },
  { icon: '💳', x: '5%',  y: '70%', delay: 1,   size: 26 },
  { icon: '🏦', x: '90%', y: '65%', delay: 1.5, size: 30 },
  { icon: '💵', x: '20%', y: '85%', delay: 0.8, size: 24 },
  { icon: '📊', x: '75%', y: '80%', delay: 1.2, size: 28 },
]

function suggestUsername(email) {
  if (!email || !email.includes('@')) return ''
  const local = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
  return local.length >= 3 ? local : ''
}

const RESEND_COOLDOWN = 60

export default function RegisterPage() {
  const navigate = useNavigate()

  // ── step: 1=email, 2=otp, 3=register ──────────────────────────────────────
  const [step, setStep] = useState(1)

  // step 1
  const [email, setEmail]         = useState('')
  const [emailError, setEmailError] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)

  // step 2
  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError]   = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [verifiedToken, setVerifiedToken] = useState('')
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const otpRefs = useRef([])
  const timerRef = useRef(null)

  // step 3
  const [formData, setFormData]   = useState({ username: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors]       = useState({})
  const [touched, setTouched]     = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [loading, setLoading]           = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [usernameAutoFilled, setUsernameAutoFilled] = useState(false)

  const strength = getPasswordStrength(formData.password)
  const checks   = getPasswordChecks(formData.password)

  // ── countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return
    setCountdown(RESEND_COOLDOWN)
    setCanResend(false)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [step])

  // ── step 1: send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    const err = validateEmail(email) || (!email.trim() ? 'Email is required' : null)
    if (err) { setEmailError(err); return }
    setEmailError('')
    setSendingOtp(true)
    try {
      await API.post('/auth/verify-email/send', { email: email.trim().toLowerCase() })
      toast.success('Verification code sent!')
      const suggestion = suggestUsername(email)
      if (suggestion) {
        setFormData(prev => ({ ...prev, username: suggestion }))
        setUsernameAutoFilled(false)
      }
      setStep(2)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to send code'
      toast.error(typeof msg === 'string' ? msg : 'Failed to send code')
    } finally {
      setSendingOtp(false)
    }
  }

  // ── step 2: OTP input handling ─────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    setOtpError('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d })
    setOtp(next)
    const focusIdx = Math.min(pasted.length, 5)
    otpRefs.current[focusIdx]?.focus()
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setOtpError('Please enter the 6-digit code'); return }
    setOtpError('')
    setVerifyingOtp(true)
    try {
      const res = await API.post('/auth/verify-email/confirm', {
        email: email.trim().toLowerCase(),
        otp: code,
      })
      setVerifiedToken(res.data.verifiedToken)
      toast.success('Email verified!')
      setStep(3)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Invalid or expired code'
      setOtpError(typeof msg === 'string' ? msg : 'Invalid or expired code')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend) return
    setSendingOtp(true)
    try {
      await API.post('/auth/verify-email/send', { email: email.trim().toLowerCase() })
      toast.success('New code sent!')
      setOtp(['', '', '', '', '', ''])
      setOtpError('')
      otpRefs.current[0]?.focus()
      // restart timer
      setStep(s => s) // force re-mount timer effect via re-trigger
      setCountdown(RESEND_COOLDOWN)
      setCanResend(false)
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to resend'
      toast.error(typeof msg === 'string' ? msg : 'Failed to resend')
    } finally {
      setSendingOtp(false)
    }
  }

  // ── step 3: registration form ──────────────────────────────────────────────
  const validate3 = (name, value) => {
    if (name === 'username')        return validateUsername(value)
    if (name === 'phone')           return validatePhone(value)
    if (name === 'password')        return validatePassword(value, true)
    if (name === 'confirmPassword') return value !== formData.password ? 'Passwords do not match' : null
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validate3(name, value) }))
    if (name === 'password' && touched.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: formData.confirmPassword !== value ? 'Passwords do not match' : null,
      }))
    }
  }

  const handleUsernameChange = (e) => {
    setUsernameAutoFilled(true)
    handleChange(e)
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    setErrors(prev => ({ ...prev, [name]: validate3(name, value) }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const allTouched = { username: true, phone: true, password: true, confirmPassword: true }
    setTouched(allTouched)
    const newErrors = {
      username:        validate3('username', formData.username),
      phone:           validate3('phone', formData.phone),
      password:        validate3('password', formData.password),
      confirmPassword: formData.confirmPassword !== formData.password ? 'Passwords do not match' : null,
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return
    if (!termsAccepted) { toast.error('Please accept the Terms of Service to continue.'); return }

    setLoading(true)
    try {
      await API.post('/auth/register/user', {
        verifiedToken,
        username: formData.username.trim(),
        email:    email.trim().toLowerCase(),
        phone:    formData.phone.trim() || null,
        password: formData.password,
      })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Registration failed'
      toast.error(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const reqItem = (met, label) => (
    <li className={`pw-req-item ${met ? 'pw-req-met' : 'pw-req-unmet'}`}>
      {met ? <FiCheck size={11} /> : <FiX size={11} />} {label}
    </li>
  )

  const suggestion = !usernameAutoFilled ? suggestUsername(email) : ''

  // ── step labels ────────────────────────────────────────────────────────────
  const steps = ['Verify Email', 'Enter Code', 'Set Up Account']

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

        {/* Step indicator */}
        <div className="reg-steps">
          {steps.map((label, i) => {
            const n = i + 1
            const state = n < step ? 'done' : n === step ? 'active' : 'pending'
            return (
              <div key={n} className={`reg-step reg-step-${state}`}>
                <div className="reg-step-circle">
                  {state === 'done' ? <FiCheck size={12} /> : n}
                </div>
                <span className="reg-step-label">{label}</span>
                {i < steps.length - 1 && <div className={`reg-step-line ${state === 'done' ? 'reg-step-line-done' : ''}`} />}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Email ──────────────────────────────────────────────── */}
          {step === 1 && (
            <motion.form key="step1" className="login-form"
              onSubmit={handleSendOtp} noValidate
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>

              <motion.div className="input-group" initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <label>Email Address</label>
                <div className={`input-wrap ${emailError ? 'input-error' : ''}`}>
                  <FiMail className="input-icon" />
                  <input type="email" placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError('') }}
                    onBlur={() => {
                      const err = validateEmail(email) || (!email.trim() ? 'Email is required' : null)
                      setEmailError(err || '')
                    }}
                    autoComplete="email" maxLength={100} autoFocus />
                </div>
                {emailError && <span className="field-error-msg">{emailError}</span>}
                <p className="reg-step-hint">We'll send a 6-digit code to verify this address.</p>
              </motion.div>

              <motion.button type="submit" className="login-btn user-login-btn" disabled={sendingOtp}
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                {sendingOtp ? (
                  <div className="btn-loader"><div className="spin-ring" /><span>Sending code...</span></div>
                ) : (
                  <><FiMail size={18} /><span>Send Verification Code</span><FiArrowRight size={16} /></>
                )}
              </motion.button>
            </motion.form>
          )}

          {/* ── Step 2: OTP ────────────────────────────────────────────────── */}
          {step === 2 && (
            <motion.form key="step2" className="login-form"
              onSubmit={handleVerifyOtp} noValidate
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>

              <motion.div className="input-group" initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <p className="otp-sent-msg">
                  Code sent to <strong>{email}</strong>
                  <button type="button" className="otp-change-email"
                    onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setOtpError('') }}>
                    Change
                  </button>
                </p>

                <label>Enter 6-digit Code</label>
                <div className="otp-boxes" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      className={`otp-box ${otpError ? 'otp-box-error' : digit ? 'otp-box-filled' : ''}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onFocus={e => e.target.select()}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                {otpError && <span className="field-error-msg" style={{ textAlign: 'center', display: 'block' }}>{otpError}</span>}

                <div className="otp-resend-row">
                  {canResend ? (
                    <button type="button" className="otp-resend-btn" onClick={handleResendOtp} disabled={sendingOtp}>
                      {sendingOtp ? 'Sending...' : 'Resend Code'}
                    </button>
                  ) : (
                    <span className="otp-countdown">Resend in <strong>{countdown}s</strong></span>
                  )}
                </div>
              </motion.div>

              <motion.button type="submit" className="login-btn user-login-btn" disabled={verifyingOtp}
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                {verifyingOtp ? (
                  <div className="btn-loader"><div className="spin-ring" /><span>Verifying...</span></div>
                ) : (
                  <><FiCheck size={18} /><span>Verify Email</span><FiArrowRight size={16} /></>
                )}
              </motion.button>
            </motion.form>
          )}

          {/* ── Step 3: Registration form ──────────────────────────────────── */}
          {step === 3 && (
            <motion.form key="step3" className="login-form"
              onSubmit={handleRegister} noValidate
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>

              {/* Email — locked */}
              <motion.div className="input-group" initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
                <label>
                  Email Address <span className="field-verified-badge"><FiCheck size={10} /> Verified</span>
                </label>
                <div className="input-wrap input-locked">
                  <FiMail className="input-icon" />
                  <input type="email" value={email} readOnly tabIndex={-1} />
                </div>
              </motion.div>

              {/* Username */}
              <motion.div className="input-group" initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <label>
                  Username
                  {!usernameAutoFilled && formData.username && (
                    <span className="field-optional">auto-generated</span>
                  )}
                </label>
                <div className={`input-wrap ${touched.username && errors.username ? 'input-error' : ''}`}>
                  <FiUser className="input-icon" />
                  <input type="text" name="username" placeholder="3-30 chars, letters/numbers/underscore"
                    value={formData.username} onChange={handleUsernameChange} onBlur={handleBlur}
                    autoComplete="username" maxLength={30} />
                </div>
                {touched.username && errors.username && (
                  <span className="field-error-msg">{errors.username}</span>
                )}
                {suggestion && usernameAutoFilled && formData.username !== suggestion && (
                  <div className="username-suggestion">
                    <span className="suggest-label">Suggestion:</span>
                    <button type="button" className="suggest-btn"
                      onClick={() => setFormData(prev => ({ ...prev, username: suggestion }))}>
                      {suggestion}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Phone (optional) */}
              <motion.div className="input-group" initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                <label>Phone Number <span className="field-optional">optional</span></label>
                <div className={`input-wrap ${touched.phone && errors.phone ? 'input-error' : ''}`}>
                  <FiPhone className="input-icon" />
                  <input type="tel" name="phone" placeholder="+91 9876543210"
                    value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                    autoComplete="tel" maxLength={20} />
                </div>
                {touched.phone && errors.phone && <span className="field-error-msg">{errors.phone}</span>}
              </motion.div>

              {/* Password */}
              <motion.div className="input-group" initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <label>Password</label>
                <div className={`input-wrap ${touched.password && errors.password ? 'input-error' : ''}`}>
                  <FiLock className="input-icon" />
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    placeholder="Min 8 chars — upper, lower, number, symbol"
                    value={formData.password} onChange={handleChange} onBlur={handleBlur}
                    autoComplete="new-password" maxLength={100} />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
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
                    {reqItem(checks.special, 'Special character (!@#$ etc.)')}
                  </ul>
                )}
                {touched.password && errors.password && !formData.password && (
                  <span className="field-error-msg">{errors.password}</span>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div className="input-group" initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
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

              {/* Terms */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <label className="checkbox-row">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                  <span>
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}>Terms of Service</a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}>Privacy Policy</a>
                  </span>
                </label>
              </motion.div>

              <motion.button type="submit" className="login-btn user-login-btn" disabled={loading}
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                {loading ? (
                  <div className="btn-loader"><div className="spin-ring" /><span>Creating account...</span></div>
                ) : (
                  <><FiUserPlus size={18} /><span>Create Account</span></>
                )}
              </motion.button>
            </motion.form>
          )}

        </AnimatePresence>

        <motion.p className="switch-role-link" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}>
          Already have an account?{' '}
          <Link to="/login" className="role-link admin-role-link">Sign In →</Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
