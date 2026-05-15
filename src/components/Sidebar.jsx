import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGrid, FiList, FiUser, FiLogOut, FiTrendingUp,
  FiUsers, FiBarChart2, FiChevronLeft, FiChevronRight,
  FiTarget
} from 'react-icons/fi'
import { MdAdminPanelSettings } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const userNavItems = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard', color: '#667eea' },
  { to: '/transactions', icon: FiList, label: 'Transactions', color: '#38ef7d' },
  { to: '/analytics', icon: FiBarChart2, label: 'Analytics', color: '#f7971e' },
  { to: '/budget', icon: FiTarget, label: 'Budget Goals', color: '#00c6ff' },
  { to: '/profile', icon: FiUser, label: 'My Profile', color: '#a78bfa' },
]

const adminNavItems = [
  { to: '/admin/dashboard', tab: 'overview', icon: FiGrid, label: 'Overview', color: '#667eea' },
  { to: '/admin/dashboard?tab=users', tab: 'users', icon: FiUsers, label: 'All Users', color: '#38ef7d' },
  { to: '/admin/dashboard?tab=transactions', tab: 'transactions', icon: FiList, label: 'All Transactions', color: '#f7971e' },
  { to: '/admin/dashboard?tab=analytics', tab: 'analytics', icon: FiBarChart2, label: 'Analytics', color: '#eb3349' },
  { to: '/admin/profile', tab: null, icon: FiUser, label: 'My Profile', color: '#a78bfa' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'
  const navItems = isAdmin ? adminNavItems : userNavItems

  const urlParams = new URLSearchParams(location.search)
  const activeAdminTab = urlParams.get('tab') || 'overview'

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate(isAdmin ? '/admin/login' : '/login')
  }

  const isAdminItemActive = (item) => {
    if (item.tab !== null) {
      return location.pathname === '/admin/dashboard' && activeAdminTab === item.tab
    }
    return location.pathname === item.to
  }

  return (
    <motion.aside
      className={`sidebar ${isAdmin ? 'sidebar-admin' : 'sidebar-user'} ${collapsed ? 'sidebar-collapsed' : ''}`}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
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
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="sidebar-logo-text"
            >
              <span className="logo-name">BudgetPro</span>
              {isAdmin && <span className="admin-badge-small">ADMIN</span>}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>

      {/* User profile mini — click to go to profile */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="sidebar-profile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate(isAdmin ? '/admin/profile' : '/profile')}
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            <div className={`avatar ${isAdmin ? 'avatar-admin' : 'avatar-user'}`}>
              {user?.username?.charAt(0).toUpperCase()}
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

      {/* Navigation */}
      <nav className="sidebar-nav">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              className="nav-section-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isAdmin ? 'MANAGEMENT' : 'NAVIGATION'}
            </motion.p>
          )}
        </AnimatePresence>

        {navItems.map((item, i) => (
          <motion.div
            key={item.to + item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {isAdmin ? (
              <button
                className={`nav-item ${isAdminItemActive(item) ? 'nav-active-admin' : ''}`}
                style={{ '--nc': item.color }}
                onClick={() => navigate(item.to)}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className="nav-icon" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ) : (
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-active-user' : ''}`
                }
                style={{ '--nc': item.color }}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className="nav-icon" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            )}
          </motion.div>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
        >
          <FiLogOut size={20} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
