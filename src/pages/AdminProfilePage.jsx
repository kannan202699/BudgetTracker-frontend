import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiEdit2, FiSave, FiX, FiShield } from 'react-icons/fi'
import { MdAdminPanelSettings } from 'react-icons/md'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import API from '../api/axiosConfig'

export default function AdminProfilePage() {
  const { user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ email: '', fullName: '', phone: '' })

  useEffect(() => {
    API.get('/user/profile').then((res) => {
      const d = res.data
      setForm({ email: d.email || '', fullName: d.fullName || '', phone: d.phone || '' })
    }).catch(() => {})
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await API.put('/user/profile', form)
      toast.success('Profile updated!')
      setEditMode(false)
    } catch {
      toast.error('Failed to update profile')
    }
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className={`main-content admin-main ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <div className="page-header admin-header">
          <div className="header-left">
            <h1 className="page-title admin-page-title">Admin Profile</h1>
            <p className="page-subtitle"><FiShield size={13} /> Manage your administrator account</p>
          </div>
        </div>

        <div className="profile-layout">
          <motion.div className="profile-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="profile-hero">
              <motion.div className="profile-avatar-xl admin-avatar" whileHover={{ scale: 1.05 }}>
                {user?.username?.charAt(0).toUpperCase()}
              </motion.div>
              <h2 className="profile-username">{user?.username}</h2>
              <span className="profile-role-badge admin-role-badge">
                <MdAdminPanelSettings size={13} /> Administrator
              </span>
            </div>
            <div className="profile-stats">
              <div className="pstat">
                <span className="pstat-val" style={{ color: '#a78bfa' }}>⚡</span>
                <span className="pstat-lbl">Full Access</span>
              </div>
              <div className="pstat">
                <span className="pstat-val" style={{ color: '#667eea' }}>🛡️</span>
                <span className="pstat-lbl">Admin Role</span>
              </div>
              <div className="pstat">
                <span className="pstat-val" style={{ color: '#38ef7d' }}>✓</span>
                <span className="pstat-lbl">Verified</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="profile-details-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="card-title-row">
              <h3 className="card-section-title">Account Details</h3>
              {!editMode ? (
                <button className="edit-profile-btn" onClick={() => setEditMode(true)}><FiEdit2 size={14} /> Edit</button>
              ) : (
                <button className="cancel-profile-btn" onClick={() => setEditMode(false)}><FiX size={14} /> Cancel</button>
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
                  <FiShield className="field-icon" />
                  <div>
                    <span className="field-label">Role</span>
                    <span className="field-value" style={{ color: '#a78bfa' }}>Administrator</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="profile-edit-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Enter full name" value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="Enter email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" placeholder="Enter phone number" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <motion.button type="submit" className="primary-btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
