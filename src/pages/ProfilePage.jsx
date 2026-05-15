import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiCalendar, FiEdit2, FiSave, FiX, FiShield, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import API from '../api/axiosConfig'
import { validateEmail, validatePhone, validateFullName } from '../utils/validators'

export default function ProfilePage() {
  const { user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [stats, setStats] = useState({ total: 0, income: 0, expense: 0 })
  const [form, setForm] = useState({ email: '', fullName: '', phone: '' })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    API.get('/user/profile').then((res) => {
      const data = res.data
      setForm({
        email: data.email || '',
        fullName: data.fullName || '',
        phone: data.phone || '',
      })
    }).catch(() => {})

    API.get('/transactions/all').then((res) => {
      const txns = Array.isArray(res.data) ? res.data : []
      const income = txns.filter((t) => t.type?.toUpperCase() === 'INCOME').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
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
    } catch {
      toast.error('Failed to update profile')
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
          <motion.div
            className="profile-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="profile-hero">
              <motion.div
                className="profile-avatar-xl"
                whileHover={{ scale: 1.05 }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </motion.div>
              <h2 className="profile-username">{user?.username}</h2>
              <span className="profile-role-badge">
                <FiShield size={12} /> {user?.role || 'USER'}
              </span>
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
          <motion.div
            className="profile-details-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-title-row">
              <h3 className="card-section-title">Account Details</h3>
              {!editMode ? (
                <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
                  <FiEdit2 size={14} /> Edit
                </button>
              ) : (
                <button className="cancel-profile-btn" onClick={() => setEditMode(false)}>
                  <FiX size={14} /> Cancel
                </button>
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
                  <FiMail className="field-icon" />
                  <div>
                    <span className="field-label">Email</span>
                    <span className="field-value">{form.email || 'Not set'}</span>
                  </div>
                </div>
                <div className="profile-field">
                  <FiUser className="field-icon" />
                  <div>
                    <span className="field-label">Full Name</span>
                    <span className="field-value">{form.fullName || 'Not set'}</span>
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
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    maxLength={60} />
                  {formErrors.fullName && <span className="field-error-msg">{formErrors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="Enter your email" value={form.email}
                    className={formErrors.email ? 'input-field-error' : ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={100} />
                  {formErrors.email && <span className="field-error-msg">{formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" placeholder="Enter phone number" value={form.phone}
                    className={formErrors.phone ? 'input-field-error' : ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={20} />
                  {formErrors.phone && <span className="field-error-msg">{formErrors.phone}</span>}
                </div>
                <motion.button
                  type="submit"
                  className="primary-btn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiSave size={16} /> Save Changes
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
