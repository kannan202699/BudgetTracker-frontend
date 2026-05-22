import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiCalendar, FiEdit2, FiSave, FiX, FiShield, FiPhone, FiCamera, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import API from '../api/axiosConfig'
import { validateEmail, validatePhone, validateFullName, validatePassword, getPasswordStrength, getPasswordChecks } from '../utils/validators'

function resizeImage(file, maxSize = 200) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [stats, setStats] = useState({ total: 0, income: 0, expense: 0 })
  const [form, setForm] = useState({ email: '', fullName: '', phone: '' })
  const [formErrors, setFormErrors] = useState({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  // Change password state
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwLoading, setPwLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const pwStrength = getPasswordStrength(pwForm.newPassword)
  const pwChecks   = getPasswordChecks(pwForm.newPassword)

  useEffect(() => {
    if (user) {
      setForm({
        email:    user.email    || '',
        fullName: user.fullName || '',
        phone:    user.phone    || '',
      })
    }
  }, [user])

  useEffect(() => {
    API.get('/transactions/all').then((res) => {
      const txns = Array.isArray(res.data) ? res.data : []
      const income  = txns.filter((t) => t.type?.toUpperCase() === 'INCOME').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
      const expense = txns.filter((t) => t.type?.toUpperCase() === 'EXPENSE').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
      setStats({ total: txns.length, income, expense })
    }).catch(() => {})
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = {
      email:    validateEmail(form.email),
      fullName: validateFullName(form.fullName),
      phone:    validatePhone(form.phone),
    }
    setFormErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    try {
      await API.put('/user/profile', form)
      toast.success('Profile updated successfully!')
      setEditMode(false)
      setFormErrors({})
      refreshProfile()
    } catch {
      toast.error('Failed to update profile')
    }
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setUploadingAvatar(true)
    try {
      const resized = await resizeImage(file, 200)
      await API.post('/user/profile/avatar', { imageData: resized })
      toast.success('Profile picture updated!')
      refreshProfile()
    } catch {
      toast.error('Failed to upload picture')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true)
    try {
      await API.post('/user/profile/avatar', { imageData: '' })
      toast.success('Profile picture removed')
      refreshProfile()
    } catch {
      toast.error('Failed to remove picture')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required'
    const newPwErr = validatePassword(pwForm.newPassword, true)
    if (newPwErr) errs.newPassword = newPwErr
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setPwErrors(errs)
    if (Object.keys(errs).length) return

    setPwLoading(true)
    try {
      await API.put('/user/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success('Password changed successfully!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwErrors({})
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to change password'
      toast.error(typeof msg === 'string' ? msg : 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your account information</p>
          </div>
        </div>

        <div className="profile-layout">
          {/* Profile card */}
          <motion.div className="profile-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="profile-hero">
              {/* Avatar with upload overlay */}
              <div className="profile-avatar-wrap" style={{ position: 'relative', display: 'inline-block' }}>
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="profile-avatar-xl profile-avatar-img"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <motion.div className="profile-avatar-xl" whileHover={{ scale: 1.05 }}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </motion.div>
                )}

                {/* Camera overlay */}
                <button
                  className="avatar-upload-btn"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  title="Change profile picture"
                >
                  {uploadingAvatar
                    ? <span className="avatar-upload-spinner" />
                    : <FiCamera size={14} />
                  }
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>

              <h2 className="profile-username">{user?.username}</h2>
              <span className="profile-role-badge">
                <FiShield size={12} /> {user?.role || 'USER'}
              </span>

              {user?.profilePicture && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer' }}
                >
                  Remove photo
                </button>
              )}
            </div>

            <div className="profile-stats">
              <div className="pstat">
                <span className="pstat-val">{stats.total}</span>
                <span className="pstat-lbl">Transactions</span>
              </div>
              <div className="pstat">
                <span className="pstat-val income-color">₹{(stats.income / 1000).toFixed(1)}K</span>
                <span className="pstat-lbl">Total Income</span>
              </div>
              <div className="pstat">
                <span className="pstat-val expense-color">₹{(stats.expense / 1000).toFixed(1)}K</span>
                <span className="pstat-lbl">Total Expense</span>
              </div>
            </div>
          </motion.div>

          {/* Profile details / edit */}
          <motion.div className="profile-details-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="card-title-row">
              <h3 className="card-section-title">Account Details</h3>
              {!editMode ? (
                <button className="edit-profile-btn" onClick={() => setEditMode(true)}><FiEdit2 size={14} /> Edit</button>
              ) : (
                <button className="cancel-profile-btn" onClick={() => { setEditMode(false); setFormErrors({}) }}><FiX size={14} /> Cancel</button>
              )}
            </div>

            {!editMode ? (
              <div className="profile-fields">
                <div className="profile-field">
                  <FiUser className="field-icon" />
                  <div>
                    <span className="field-label">Username</span>
                    <span className="field-value">{user?.username}</span>
                  </div>
                </div>
                <div className="profile-field">
                  <FiUser className="field-icon" />
                  <div>
                    <span className="field-label">Full Name</span>
                    <span className="field-value">{user?.fullName || 'Not set'}</span>
                  </div>
                </div>
                <div className="profile-field">
                  <FiMail className="field-icon" />
                  <div>
                    <span className="field-label">Email</span>
                    <span className="field-value">{user?.email || 'Not set'}</span>
                  </div>
                </div>
                <div className="profile-field">
                  <FiPhone className="field-icon" />
                  <div>
                    <span className="field-label">Phone</span>
                    <span className="field-value">{user?.phone || 'Not set'}</span>
                  </div>
                </div>
                <div className="profile-field">
                  <FiCalendar className="field-icon" />
                  <div>
                    <span className="field-label">Member Since</span>
                    <span className="field-value">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="profile-edit-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Enter your full name" value={form.fullName}
                    className={formErrors.fullName ? 'input-field-error' : ''}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })} maxLength={60} />
                  {formErrors.fullName && <span className="field-error-msg">{formErrors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="Enter your email" value={form.email}
                    className={formErrors.email ? 'input-field-error' : ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={100} />
                  {formErrors.email && <span className="field-error-msg">{formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" placeholder="Enter phone number" value={form.phone}
                    className={formErrors.phone ? 'input-field-error' : ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                  {formErrors.phone && <span className="field-error-msg">{formErrors.phone}</span>}
                </div>
                <motion.button type="submit" className="primary-btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <FiSave size={16} /> Save Changes
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Change Password card */}
          <motion.div className="profile-details-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="card-title-row">
              <h3 className="card-section-title"><FiLock size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Change Password</h3>
            </div>
            <form onSubmit={handleChangePassword} className="profile-edit-form" noValidate>
              {/* Current password */}
              <div className="form-group">
                <label>Current Password</label>
                <div className={`input-wrap ${pwErrors.currentPassword ? 'input-error' : ''}`} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                  <FiLock className="input-icon" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={pwForm.currentPassword}
                    onChange={e => { setPwForm(p => ({ ...p, currentPassword: e.target.value })); setPwErrors(p => ({ ...p, currentPassword: null })) }}
                    autoComplete="current-password"
                    maxLength={100}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowCurrent(v => !v)}>
                    {showCurrent ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {pwErrors.currentPassword && <span className="field-error-msg">{pwErrors.currentPassword}</span>}
              </div>

              {/* New password */}
              <div className="form-group">
                <label>New Password</label>
                <div className={`input-wrap ${pwErrors.newPassword ? 'input-error' : ''}`} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                  <FiLock className="input-icon" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Min 8 chars — upper, lower, number, symbol"
                    value={pwForm.newPassword}
                    onChange={e => { setPwForm(p => ({ ...p, newPassword: e.target.value })); setPwErrors(p => ({ ...p, newPassword: null })) }}
                    autoComplete="new-password"
                    maxLength={100}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowNew(v => !v)}>
                    {showNew ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {pwForm.newPassword && (
                  <div className="pw-strength-wrap">
                    <div className="pw-strength-bar">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="pw-strength-seg"
                          style={{ background: pwStrength.score >= i ? pwStrength.color : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <span className="pw-strength-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                  </div>
                )}
                {pwErrors.newPassword && <span className="field-error-msg">{pwErrors.newPassword}</span>}
              </div>

              {/* Confirm new password */}
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className={`input-wrap ${pwErrors.confirmPassword ? 'input-error' : ''}`} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                  <FiLock className="input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={pwForm.confirmPassword}
                    onChange={e => { setPwForm(p => ({ ...p, confirmPassword: e.target.value })); setPwErrors(p => ({ ...p, confirmPassword: null })) }}
                    autoComplete="new-password"
                    maxLength={100}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {pwErrors.confirmPassword && <span className="field-error-msg">{pwErrors.confirmPassword}</span>}
              </div>

              <p className="pw-change-note">
                <FiShield size={12} /> Changing your password will sign you out on all other devices.
              </p>

              <motion.button type="submit" className="primary-btn" disabled={pwLoading}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {pwLoading ? 'Updating...' : <><FiCheck size={16} /> Update Password</>}
              </motion.button>
            </form>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
