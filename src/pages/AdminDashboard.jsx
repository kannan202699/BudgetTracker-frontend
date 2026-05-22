import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import {
  FiRefreshCw, FiDownload, FiUsers, FiList, FiBarChart2,
  FiShield, FiActivity, FiUserX, FiX, FiMail, FiPhone,
  FiEye, FiSearch, FiFilter, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiClock, FiChevronDown,
} from 'react-icons/fi'
import { MdAdminPanelSettings } from 'react-icons/md'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import TransactionTable from '../components/TransactionTable'
import { IncomeExpenseBarChart, CategoryPieChart, FinancialInsights } from '../components/Charts'
import { useAuth } from '../context/AuthContext'
import API from '../api/axiosConfig'

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, icon: Icon, gradient, delay }) {
  return (
    <motion.div className="admin-stat-card" style={{ background: gradient }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }} whileHover={{ y: -5, scale: 1.02 }}>
      <div className="admin-card-icon"><Icon size={24} /></div>
      <div>
        <p className="admin-card-label">{label}</p>
        <p className="admin-card-value">{value}</p>
        {sub && <p className="admin-card-sub">{sub}</p>}
      </div>
      <div className="card-deco-circle" />
    </motion.div>
  )
}

/* ─── User Detail Modal ─── */
function UserDetailModal({ user, transactions, onClose, onDelete }) {
  if (!user) return null
  const userTxns = transactions.filter((t) => t.username === user.username)
  const income  = userTxns.filter((t) => String(t.type || '').toUpperCase() === 'INCOME').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const expense = userTxns.filter((t) => String(t.type || '').toUpperCase() === 'EXPENSE').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const balance = income - expense
  const isAdminUser = user.role === 'ADMIN'
  const recentTxns = [...userTxns].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="user-detail-modal"
        initial={{ opacity: 0, scale: 0.93, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}>

        <div className="udm-header">
          <div className="udm-avatar-wrap">
            {user.profilePicture
              ? <img src={user.profilePicture} alt={user.username} className="udm-avatar-img" />
              : <div className="udm-avatar-letter">{user.username.charAt(0).toUpperCase()}</div>
            }
          </div>
          <div className="udm-identity">
            <h2 className="udm-username">{user.username}</h2>
            {user.fullName && <p className="udm-fullname">{user.fullName}</p>}
            <span className={`user-role-badge ${isAdminUser ? 'badge-admin' : 'badge-user'}`}>{user.role}</span>
          </div>
          <button className="udm-close-btn" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="udm-contact-row">
          {user.email && <div className="udm-contact-item"><FiMail size={13} /><span>{user.email}</span></div>}
          {user.phone && <div className="udm-contact-item"><FiPhone size={13} /><span>{user.phone}</span></div>}
          {!user.email && !user.phone && <p className="udm-no-contact">No contact info on file</p>}
        </div>

        <div className="udm-stats">
          <div className="udm-stat"><span className="udm-stat-val">{userTxns.length}</span><span className="udm-stat-lbl">Transactions</span></div>
          <div className="udm-stat"><span className="udm-stat-val" style={{ color: '#38ef7d' }}>₹{income.toLocaleString('en-IN')}</span><span className="udm-stat-lbl">Income</span></div>
          <div className="udm-stat"><span className="udm-stat-val" style={{ color: '#eb3349' }}>₹{expense.toLocaleString('en-IN')}</span><span className="udm-stat-lbl">Expense</span></div>
          <div className="udm-stat">
            <span className="udm-stat-val" style={{ color: balance >= 0 ? '#38ef7d' : '#eb3349' }}>
              {balance >= 0 ? '+' : ''}₹{balance.toLocaleString('en-IN')}
            </span>
            <span className="udm-stat-lbl">Balance</span>
          </div>
        </div>

        {recentTxns.length > 0 && (
          <div className="udm-recent">
            <h4 className="udm-section-title">Recent Transactions</h4>
            <div className="udm-txn-list">
              {recentTxns.map((t) => (
                <div key={t.id} className="udm-txn-row">
                  <div className={`udm-txn-dot ${String(t.type||'').toUpperCase()==='INCOME'?'dot-income':'dot-expense'}`} />
                  <span className="udm-txn-desc">{t.description || t.category}</span>
                  <span className="udm-txn-cat">{t.category}</span>
                  <span className={`udm-txn-amt ${String(t.type||'').toUpperCase()==='INCOME'?'income-amt':'expense-amt'}`}>
                    {String(t.type||'').toUpperCase()==='INCOME'?'+':'-'}₹{parseFloat(t.amount||0).toLocaleString('en-IN')}
                  </span>
                  <span className="udm-txn-date">{t.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isAdminUser && (
          <div className="udm-actions">
            <motion.button
              className="udm-delete-btn"
              onClick={() => { onDelete(user.id, user.username); onClose() }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <FiUserX size={15} /> Delete User &amp; All Data
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ─── Main Component ─── */
export default function AdminDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const [allTransactions, setAllTransactions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // Filters
  const [userSearch, setUserSearch] = useState('')
  const [userSort, setUserSort] = useState('transactions') // transactions | income | expense | name
  const [txnUserFilter, setTxnUserFilter] = useState('all')

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await API.get('/admin/transactions')
      setAllTransactions(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await API.get('/admin/users')
      setAllUsers(Array.isArray(res.data) ? res.data : [])
    } catch {
      setAllUsers([])
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => { fetchTransactions(); fetchUsers() }, [fetchTransactions, fetchUsers])

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return
    try {
      await API.delete(`/admin/transactions/${id}`)
      toast.success('Transaction deleted')
      fetchTransactions()
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}" and ALL their data? This cannot be undone.`)) return
    try {
      await API.delete(`/admin/users/${userId}`)
      toast.success(`User "${username}" deleted`)
      fetchUsers(); fetchTransactions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleExportCSV = () => {
    if (!allTransactions.length) { toast.error('No data to export'); return }
    const rows = allTransactions.map((t) => [t.username, t.category, t.description, t.amount, t.type, t.date])
    const csv = [['Username','Category','Description','Amount','Type','Date'], ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `all_transactions_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    toast.success('Exported!')
  }

  /* ── Derived stats ── */
  const totalIncome  = useMemo(() => allTransactions.filter((t) => String(t.type||'').toUpperCase()==='INCOME').reduce((s,t) => s+(parseFloat(t.amount)||0), 0), [allTransactions])
  const totalExpense = useMemo(() => allTransactions.filter((t) => String(t.type||'').toUpperCase()==='EXPENSE').reduce((s,t) => s+(parseFloat(t.amount)||0), 0), [allTransactions])
  const netBalance   = totalIncome - totalExpense
  const activeUsers  = useMemo(() => new Set(allTransactions.map((t) => t.username).filter(Boolean)).size, [allTransactions])
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  /* ── User enrichment (with stats) ── */
  const usersWithStats = useMemo(() => allUsers.map((u) => {
    const txns   = allTransactions.filter((t) => t.username === u.username)
    const income = txns.filter((t) => String(t.type||'').toUpperCase()==='INCOME').reduce((s,t) => s+(parseFloat(t.amount)||0), 0)
    const expense= txns.filter((t) => String(t.type||'').toUpperCase()==='EXPENSE').reduce((s,t) => s+(parseFloat(t.amount)||0), 0)
    return { ...u, txnCount: txns.length, income, expense, balance: income-expense }
  }), [allUsers, allTransactions])

  /* ── Filtered + sorted users ── */
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim()
    const list = q
      ? usersWithStats.filter((u) => u.username.toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || (u.fullName||'').toLowerCase().includes(q))
      : usersWithStats
    return [...list].sort((a, b) => {
      if (userSort === 'name')        return a.username.localeCompare(b.username)
      if (userSort === 'income')      return b.income - a.income
      if (userSort === 'expense')     return b.expense - a.expense
      return b.txnCount - a.txnCount
    })
  }, [usersWithStats, userSearch, userSort])

  /* ── Filtered transactions ── */
  const filteredTxns = useMemo(() => (
    txnUserFilter === 'all' ? allTransactions : allTransactions.filter((t) => t.username === txnUserFilter)
  ), [allTransactions, txnUserFilter])

  /* ── Top spenders ── */
  const topSpenders = useMemo(() => (
    [...usersWithStats].filter((u) => u.role !== 'ADMIN').sort((a,b) => b.expense - a.expense).slice(0, 5)
  ), [usersWithStats])

  /* ── Recent activity (last 8 txns across platform) ── */
  const recentActivity = useMemo(() => (
    [...allTransactions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 8)
  ), [allTransactions])

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={`main-content admin-main ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        {/* Header */}
        <div className="page-header admin-header">
          <div className="header-left">
            <div className="admin-welcome">
              <motion.div className="admin-header-icon"
                animate={{ rotate: [0,10,-10,0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}>
                <MdAdminPanelSettings size={36} />
              </motion.div>
              <div>
                <div className="admin-title-row">
                  <h1 className="page-title admin-page-title">Admin Control Center</h1>
                  <span className="admin-badge-large">ADMIN</span>
                </div>
                <p className="page-subtitle"><FiShield size={13} /> Logged in as {user?.username} · {today}</p>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <motion.button className="icon-btn" onClick={() => { fetchTransactions(); fetchUsers() }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} title="Refresh">
              <FiRefreshCw size={16} className={loading ? 'spin' : ''} />
            </motion.button>
            <motion.button className="icon-btn" onClick={handleExportCSV} whileHover={{ scale: 1.08 }} title="Export CSV">
              <FiDownload size={16} />
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-nav admin-tab-nav">
          {[
            { key: 'overview',     label: 'Overview',         icon: FiActivity },
            { key: 'users',        label: 'All Users',        icon: FiUsers },
            { key: 'transactions', label: 'All Transactions', icon: FiList },
            { key: 'analytics',   label: 'Analytics',        icon: FiBarChart2 },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key}
              className={`tab-btn admin-tab ${activeTab === key ? 'tab-active admin-tab-active' : ''}`}
              onClick={() => setSearchParams(key === 'overview' ? {} : { tab: key })}>
              <Icon size={15} /><span>{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

              {/* 6-card stats grid */}
              <div className="admin-stats-grid admin-stats-6">
                <StatCard label="Total Users" value={usersLoading ? '...' : allUsers.length}
                  sub={`${activeUsers} active`}
                  icon={FiUsers} gradient="linear-gradient(135deg,#667eea,#764ba2)" delay={0} />
                <StatCard label="Active Users" value={usersLoading ? '...' : activeUsers}
                  sub="with transactions"
                  icon={FiActivity} gradient="linear-gradient(135deg,#f093fb,#f5576c)" delay={0.05} />
                <StatCard label="Total Transactions" value={loading ? '...' : allTransactions.length}
                  icon={FiList} gradient="linear-gradient(135deg,#f7971e,#ffd200)" delay={0.1} />
                <StatCard label="Platform Income" value={loading ? '...' : `₹${(totalIncome/1000).toFixed(1)}K`}
                  icon={FiTrendingUp} gradient="linear-gradient(135deg,#11998e,#38ef7d)" delay={0.15} />
                <StatCard label="Platform Expense" value={loading ? '...' : `₹${(totalExpense/1000).toFixed(1)}K`}
                  icon={FiTrendingDown} gradient="linear-gradient(135deg,#eb3349,#f45c43)" delay={0.2} />
                <StatCard label="Net Balance" value={loading ? '...' : `${netBalance>=0?'+':''}₹${(netBalance/1000).toFixed(1)}K`}
                  icon={FiDollarSign}
                  gradient={netBalance>=0 ? "linear-gradient(135deg,#1fa2ff,#12d8fa)" : "linear-gradient(135deg,#fc4a1a,#f7b733)"}
                  delay={0.25} />
              </div>

              {/* Charts */}
              <div className="charts-grid">
                <IncomeExpenseBarChart transactions={allTransactions} />
                <CategoryPieChart transactions={allTransactions} />
              </div>

              {/* Two-column: Recent Activity + Top Spenders */}
              <div className="admin-overview-bottom">
                {/* Recent Activity */}
                <div className="admin-panel-card">
                  <div className="section-header" style={{ marginBottom: 14 }}>
                    <h3 className="section-title" style={{ fontSize: 15 }}><FiClock size={14} style={{ marginRight: 6 }} />Recent Activity</h3>
                    <button className="view-all-btn" onClick={() => setSearchParams({ tab: 'transactions' })}>View All →</button>
                  </div>
                  <div className="admin-activity-list">
                    {recentActivity.length === 0 && <p className="empty-hint">No transactions yet</p>}
                    {recentActivity.map((t) => (
                      <div key={t.id} className="admin-activity-row">
                        <div className={`udm-txn-dot ${String(t.type||'').toUpperCase()==='INCOME'?'dot-income':'dot-expense'}`} style={{ margin: '0 4px' }} />
                        <div className="activity-user-chip">
                          <span className="activity-username">{t.username}</span>
                        </div>
                        <span className="activity-desc">{t.description || t.category}</span>
                        <span className="activity-cat">{t.category}</span>
                        <span className={`activity-amt ${String(t.type||'').toUpperCase()==='INCOME'?'income-amt':'expense-amt'}`}>
                          {String(t.type||'').toUpperCase()==='INCOME'?'+':'-'}₹{parseFloat(t.amount||0).toLocaleString('en-IN')}
                        </span>
                        <span className="activity-date">{t.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Spenders */}
                <div className="admin-panel-card">
                  <div className="section-header" style={{ marginBottom: 14 }}>
                    <h3 className="section-title" style={{ fontSize: 15 }}><FiTrendingDown size={14} style={{ marginRight: 6 }} />Top Spenders</h3>
                    <button className="view-all-btn" onClick={() => setSearchParams({ tab: 'users' })}>View All →</button>
                  </div>
                  <div className="admin-top-list">
                    {topSpenders.length === 0 && <p className="empty-hint">No data yet</p>}
                    {topSpenders.map((u, i) => (
                      <div key={u.id} className="admin-top-row" onClick={() => setSelectedUser(u)} style={{ cursor: 'pointer' }}>
                        <span className="top-rank">#{i+1}</span>
                        <div className="top-avatar">
                          {u.profilePicture
                            ? <img src={u.profilePicture} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : u.username.charAt(0).toUpperCase()
                          }
                        </div>
                        <div className="top-info">
                          <span className="top-username">{u.username}</span>
                          <span className="top-txn-count">{u.txnCount} transactions</span>
                        </div>
                        <span className="top-expense expense-amt">₹{u.expense.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Users preview */}
              <div className="section-header" style={{ marginTop: 24 }}>
                <h2 className="section-title">Registered Users</h2>
                <button className="view-all-btn" onClick={() => setSearchParams({ tab: 'users' })}>View All →</button>
              </div>
              <div className="users-preview-grid">
                {allUsers.slice(0, 6).map((u, i) => (
                  <motion.div key={u.id||i} className="user-preview-card"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i*0.05 }} whileHover={{ y: -4 }}
                    onClick={() => setSelectedUser(usersWithStats.find((x) => x.id===u.id)||u)}
                    style={{ cursor: 'pointer' }}>
                    <div className="user-avatar-lg" style={{ overflow: 'hidden', padding: 0 }}>
                      {u.profilePicture
                        ? <img src={u.profilePicture} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{u.username.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <p className="user-card-name">{u.username}</p>
                    <p className="user-card-email">{u.role}</p>
                    <p className="user-card-count">{allTransactions.filter((t) => t.username===u.username).length} transactions</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

              {/* Search + Sort toolbar */}
              <div className="admin-toolbar">
                <div className="admin-search-wrap">
                  <FiSearch size={15} className="admin-search-icon" />
                  <input
                    className="admin-search-input"
                    placeholder="Search by username, email or name…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  {userSearch && (
                    <button className="admin-search-clear" onClick={() => setUserSearch('')}><FiX size={13} /></button>
                  )}
                </div>
                <div className="admin-sort-wrap">
                  <FiFilter size={14} />
                  <select className="admin-sort-select" value={userSort} onChange={(e) => setUserSort(e.target.value)}>
                    <option value="transactions">Sort: Most Transactions</option>
                    <option value="income">Sort: Highest Income</option>
                    <option value="expense">Sort: Highest Expense</option>
                    <option value="name">Sort: Name A–Z</option>
                  </select>
                  <FiChevronDown size={13} className="sort-chevron" />
                </div>
              </div>

              <div className="section-header">
                <h2 className="section-title">All Registered Users</h2>
                <span className="badge-count">
                  {filteredUsers.length !== allUsers.length
                    ? `${filteredUsers.length} of ${allUsers.length}`
                    : `${allUsers.length} users`}
                </span>
              </div>

              {usersLoading ? (
                <div className="loading-cards">{[...Array(6)].map((_,i) => <div key={i} className="skeleton-card" />)}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-state-full"><p className="empty-icon">🔍</p><p>No users match your search</p></div>
              ) : (
                <div className="users-full-grid">
                  {filteredUsers.map((u, i) => {
                    const isAdminUser = u.role === 'ADMIN'
                    return (
                      <motion.div key={u.id||i} className="user-full-card"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i*0.04 }}
                        whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(102,126,234,0.2)' }}>
                        <div className="user-full-header">
                          <div className="user-avatar-xl" style={{ overflow: 'hidden', padding: 0, cursor: 'pointer', flexShrink: 0 }}
                            onClick={() => setSelectedUser(u)}>
                            {u.profilePicture
                              ? <img src={u.profilePicture} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{u.username.charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="user-full-name">{u.username}</h3>
                            {u.fullName && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName}</p>}
                            {u.email && <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>}
                            <span className={`user-role-badge ${isAdminUser?'badge-admin':'badge-user'}`}>{u.role}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                            <motion.button className="icon-btn" onClick={() => setSelectedUser(u)}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              title="View full profile" style={{ color: '#667eea' }}>
                              <FiEye size={16} />
                            </motion.button>
                            {!isAdminUser && (
                              <motion.button className="action-btn delete-btn delete-user-btn"
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                title={`Delete ${u.username}`}>
                                <FiUserX size={16} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <div className="user-full-stats">
                          <div className="user-stat"><span className="user-stat-val">{u.txnCount}</span><span className="user-stat-lbl">Transactions</span></div>
                          <div className="user-stat"><span className="user-stat-val income-color">₹{(u.income/1000).toFixed(0)}K</span><span className="user-stat-lbl">Income</span></div>
                          <div className="user-stat"><span className="user-stat-val expense-color">₹{(u.expense/1000).toFixed(0)}K</span><span className="user-stat-lbl">Expense</span></div>
                          <div className="user-stat">
                            <span className="user-stat-val" style={{ color: u.balance>=0?'#38ef7d':'#eb3349' }}>
                              {u.balance>=0?'+':''}₹{(Math.abs(u.balance)/1000).toFixed(0)}K
                            </span>
                            <span className="user-stat-lbl">Balance</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── TRANSACTIONS ── */}
          {activeTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

              {/* User filter */}
              <div className="admin-toolbar">
                <div className="admin-sort-wrap" style={{ flex: 1 }}>
                  <FiFilter size={14} />
                  <select className="admin-sort-select" style={{ flex: 1 }}
                    value={txnUserFilter} onChange={(e) => setTxnUserFilter(e.target.value)}>
                    <option value="all">All Users</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.username}>{u.username}</option>
                    ))}
                  </select>
                  <FiChevronDown size={13} className="sort-chevron" />
                </div>
                {txnUserFilter !== 'all' && (
                  <button className="admin-clear-filter-btn" onClick={() => setTxnUserFilter('all')}>
                    <FiX size={13} /> Clear filter
                  </button>
                )}
              </div>

              <div className="section-header">
                <h2 className="section-title">
                  {txnUserFilter === 'all' ? 'All Transactions' : `Transactions — ${txnUserFilter}`}
                </h2>
                <span className="badge-count">{filteredTxns.length} total</span>
              </div>
              {loading ? <div className="skeleton-table" /> : (
                <TransactionTable transactions={filteredTxns} onDelete={handleDeleteTransaction} isAdmin={true} />
              )}
            </motion.div>
          )}

          {/* ── ANALYTICS ── */}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="section-header"><h2 className="section-title">Platform Analytics</h2></div>
              <div className="charts-grid">
                <IncomeExpenseBarChart transactions={allTransactions} />
                <CategoryPieChart transactions={allTransactions} />
              </div>
              <FinancialInsights transactions={allTransactions} />
              <div className="analytics-section">
                <h3 className="analytics-title">Per-User Summary</h3>
                <div className="user-breakdown-table">
                  <table className="transaction-table">
                    <thead>
                      <tr><th>#</th><th>User</th><th>Role</th><th>Transactions</th><th>Income</th><th>Expense</th><th>Balance</th></tr>
                    </thead>
                    <tbody>
                      {usersWithStats.map((u, i) => (
                        <tr key={u.id||u.username} className="table-row" style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedUser(u)}>
                          <td className="row-num">{i+1}</td>
                          <td>
                            <div className="user-chip">
                              <div className="user-avatar-sm" style={{ overflow: 'hidden', padding: 0 }}>
                                {u.profilePicture
                                  ? <img src={u.profilePicture} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                  : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{u.username.charAt(0).toUpperCase()}</span>
                                }
                              </div>
                              <span>{u.username}</span>
                            </div>
                          </td>
                          <td><span className={`user-role-badge ${u.role==='ADMIN'?'badge-admin':'badge-user'}`}>{u.role}</span></td>
                          <td>{u.txnCount}</td>
                          <td><span className="income-amt">₹{u.income.toLocaleString('en-IN')}</span></td>
                          <td><span className="expense-amt">₹{u.expense.toLocaleString('en-IN')}</span></td>
                          <td><span className={u.balance>=0?'income-amt':'expense-amt'}>{u.balance>=0?'+':''}₹{u.balance.toLocaleString('en-IN')}</span></td>
                        </tr>
                      ))}
                      {usersWithStats.length === 0 && (
                        <tr><td colSpan={7} className="empty-state"><p>No user data available</p></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            transactions={allTransactions}
            onClose={() => setSelectedUser(null)}
            onDelete={handleDeleteUser}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
