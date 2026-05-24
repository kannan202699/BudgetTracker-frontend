import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGrid, FiList, FiUser, FiLogOut, FiTrendingUp,
  FiUsers, FiBarChart2, FiChevronLeft, FiChevronRight,
  FiTarget, FiAlertTriangle, FiAward, FiRepeat, FiCreditCard, FiMenu,
  FiShield,
} from 'react-icons/fi'
import { MdAdminPanelSettings } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const userNavItems = [
  { to: '/dashboard',   icon: FiGrid,       label: 'Dashboard',     color: '#667eea' },
  { to: '/transactions',icon: FiList,       label: 'Transactions',  color: '#38ef7d' },
  { to: '/analytics',   icon: FiBarChart2,  label: 'Analytics',     color: '#f7971e' },
  { to: '/budget',      icon: FiTarget,     label: 'Budget Goals',  color: '#00c6ff' },
  { to: '/savings',     icon: FiAward,      label: 'Savings Goals', color: '#ffd200' },
  { to: '/recurring',   icon: FiRepeat,     label: 'Recurring',     color: '#f093fb' },
  { to: '/emi',         icon: FiCreditCard, label: 'EMI Tracker',   color: '#4facfe' },
  { to: '/profile',     icon: FiUser,       label: 'My Profile',    color: '#a78bfa' },
]

const adminManagementItems = [
  { to: '/admin/dashboard',                    tab: 'overview',      icon: FiGrid,     label: 'Overview',        color: '#e94057' },
  { to: '/admin/dashboard?tab=users',          tab: 'users',         icon: FiUsers,    label: 'All Users',       color: '#f7971e' },
  { to: '/admin/dashboard?tab=transactions',   tab: 'transactions',  icon: FiList,     label: 'All Transactions',color: '#ffd200' },
  { to: '/admin/dashboard?tab=analytics',      tab: 'analytics',     icon: FiBarChart2,label: 'Analytics',       color: '#eb3349' },
]

const adminPersonalItems = [
  { to: '/dashboard',   icon: FiGrid,       label: 'My Dashboard',  color: '#667eea' },
  { to: '/transactions',icon: FiList,       label: 'Transactions',  color: '#38ef7d' },
  { to: '/analytics',   icon: FiBarChart2,  label: 'Analytics',     color: '#f7971e' },
  { to: '/budget',      icon: FiTarget,     label: 'Budget Goals',  color: '#00c6ff' },
  { to: '/savings',     icon: FiAward,      label: 'Savings Goals', color: '#ffd200' },
  { to: '/recurring',   icon: FiRepeat,     label: 'Recurring',     color: '#f093fb' },
  { to: '/emi',         icon: FiCreditCard, label: 'EMI Tracker',   color: '#4facfe' },
  { to: '/admin/profile',icon: FiUser,      label: 'My Profile',    color: '#a78bfa' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    const mobile = window.innerWidth <= 768
    setIsMobile(true)
    if (mobile) setCollapsed(true)

    const handler = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) setCollapsed(true)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [setCollapsed])

  const urlParams = new URLSearchParams(location.search)
  const activeAdminTab = urlParams.get('tab') || 'overview'

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    logout()
    toast.success('Logged out successfully')
    navigate(isAdmin ? '/admin/login' : '/login')
  }

  const isAdminMgmtActive = (item) => {
    if (item.tab !== null) {
      return location.pathname === '/admin/dashboard' && activeAdminTab === item.tab
    }
    return location.pathname === item.to
  }

  const NavItemBtn = ({ item, isActive }) => (
    <button
      className={`nav-item ${isActive ? (isAdmin ? 'nav-active-admin' : 'nav-active-user') : ''}`}
      style={{ '--nc': item.color }}
      onClick={() => navigate(item.to)}
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={20} className="nav-icon" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }} transition={{ duration: 0.15 }}>
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )

  return (
    <>
      {isMobile && collapsed && (
        <button className="mobile-hamburger" onClick={() => setCollapsed(false)} aria-label="Open menu">
          <FiMenu size={22} />
        </button>
      )}
      {isMobile && !collapsed && (
        <div className="sidebar-backdrop" onClick={() => setCollapsed(true)} />
      )}

      <motion.aside
        className={`sidebar ${isAdmin ? 'sidebar-admin' : 'sidebar-user'} ${collapsed ? 'sidebar-collapsed' : ''}`}
        animate={
          isMobile
            ? { x: collapsed ? -280 : 0, width: 260 }
            : { x: 0, width: collapsed ? 72 : 260 }
        }
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={isMobile ? { position: 'fixed', top: 0, left: 0, height: '100dvh', zIndex: 600 } : undefined}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <motion.div
            className={`sidebar-logo-icon ${isAdmin ? 'logo-admin' : 'logo-user'}`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {isAdmin ? <MdAdminPanelSettings size={22} /> : <FiTrendingUp size={22} />}
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="sidebar-logo-text">
                <span className="logo-name">BudgetPro</span>
                {isAdmin && <span className="admin-badge-small">ADMIN</span>}
              </motion.div>
            )}
          </AnimatePresence>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        </div>

        {/* Profile mini */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div className="sidebar-profile"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              onClick={() => navigate(isAdmin ? '/admin/profile' : '/profile')}
              style={{ cursor: 'pointer' }} title="View Profile">
              <div className={`avatar ${isAdmin ? 'avatar-admin' : 'avatar-user'}`}>
                {user?.profilePicture
                  ? <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : user?.username?.charAt(0).toUpperCase()
                }
              </div>
              <div className="profile-info">
                <p className="profile-name">{user?.username}</p>
                <p className={`profile-role ${isAdmin ? 'role-admin' : 'role-user'}`}>
                  {isAdmin ? '⚡ Administrator' : '👤 User'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav for regular users */}
        {!isAdmin && (
          <nav className="sidebar-nav">
            <AnimatePresence>
              {!collapsed && (
                <motion.p className="nav-section-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  NAVIGATION
                </motion.p>
              )}
            </AnimatePresence>
            {userNavItems.map((item, i) => (
              <motion.div key={item.to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}>
                <NavLink to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-active-user' : ''}`}
                  style={{ '--nc': item.color }}
                  title={collapsed ? item.label : undefined}>
                  <item.icon size={20} className="nav-icon" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }} transition={{ duration: 0.15 }}>
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </motion.div>
            ))}
          </nav>
        )}

        {/* Nav for admin — two sections */}
        {isAdmin && (
          <nav className="sidebar-nav admin-dual-nav">
            {/* ADMIN PANEL section */}
            <AnimatePresence>
              {!collapsed && (
                <motion.p className="nav-section-label nav-section-admin"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <FiShield size={10} /> ADMIN PANEL
                </motion.p>
              )}
            </AnimatePresence>
            {adminManagementItems.map((item, i) => (
              <motion.div key={item.to + item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}>
                <NavItemBtn item={item} isActive={isAdminMgmtActive(item)} />
              </motion.div>
            ))}

            {/* MY ACCOUNT section */}
            <AnimatePresence>
              {!collapsed && (
                <motion.p className="nav-section-label nav-section-personal"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ marginTop: 12 }}>
                  MY ACCOUNT
                </motion.p>
              )}
            </AnimatePresence>
            {!collapsed && <div className="nav-section-divider" />}
            {adminPersonalItems.map((item, i) => (
              <motion.div key={item.to + item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (adminManagementItems.length + i) * 0.04 }}>
                <NavLink to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-active-user' : ''}`}
                  style={{ '--nc': item.color }}
                  title={collapsed ? item.label : undefined}>
                  <item.icon size={20} className="nav-icon" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }} transition={{ duration: 0.15 }}>
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </motion.div>
            ))}
          </nav>
        )}

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : undefined}>
            <FiLogOut size={20} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Logout confirm modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} onClick={() => setShowLogoutConfirm(false)}>
              <motion.div className="modal-card logout-confirm-card"
                initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={(e) => e.stopPropagation()}>
                <div className="logout-confirm-body">
                  <div className="logout-confirm-icon"><FiAlertTriangle size={26} /></div>
                  <h3 className="logout-confirm-title">Sign out?</h3>
                  <p className="logout-confirm-msg">You'll need to log in again to access your account.</p>
                  <div className="logout-confirm-actions">
                    <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                    <button className="btn-logout-confirm" onClick={confirmLogout}>
                      <FiLogOut size={15} /> Yes, sign out
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  )
}
