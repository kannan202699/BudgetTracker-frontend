import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import {
  FiRefreshCw, FiDownload, FiUsers, FiList, FiBarChart2,
  FiShield, FiTrash2, FiCalendar, FiActivity, FiUserX
} from 'react-icons/fi'
import { MdAdminPanelSettings } from 'react-icons/md'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import TransactionTable from '../components/TransactionTable'
import { IncomeExpenseBarChart, CategoryPieChart, FinancialInsights } from '../components/Charts'
import { useAuth } from '../context/AuthContext'
import API from '../api/axiosConfig'

function AdminStatCard({ label, value, icon: Icon, gradient, delay }) {
  return (
    <motion.div className="admin-stat-card" style={{ background: gradient }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }} whileHover={{ y: -5, scale: 1.02 }}>
      <div className="admin-card-icon"><Icon size={24} /></div>
      <div>
        <p className="admin-card-label">{label}</p>
        <p className="admin-card-value">{value}</p>
      </div>
      <div className="card-deco-circle" />
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const [allTransactions, setAllTransactions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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

  useEffect(() => {
    fetchTransactions()
    fetchUsers()
  }, [fetchTransactions, fetchUsers])

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
    if (!window.confirm(`Delete user "${username}" and ALL their transactions? This cannot be undone.`)) return
    try {
      await API.delete(`/admin/users/${userId}`)
      toast.success(`User "${username}" deleted`)
      fetchUsers()
      fetchTransactions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleExportCSV = () => {
    if (!allTransactions.length) { toast.error('No data to export'); return }
    const headers = ['Username', 'Category', 'Description', 'Amount', 'Type', 'Date']
    const rows = allTransactions.map((t) => [t.username, t.category, t.description, t.amount, t.type, t.date])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `all_transactions_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    toast.success('Exported!')
  }

  const totalIncome = allTransactions.filter((t) => String(t.type || '').toUpperCase() === 'INCOME').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const totalExpense = allTransactions.filter((t) => String(t.type || '').toUpperCase() === 'EXPENSE').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const uniqueUsers = [...new Set(allTransactions.map((t) => t.username).filter(Boolean))]
  const nonAdminUsers = allUsers.filter((u) => u.role !== 'ADMIN')

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={`main-content admin-main ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <div className="page-header admin-header">
          <div className="header-left">
            <div className="admin-welcome">
              <motion.div className="admin-header-icon"
                animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}>
                <MdAdminPanelSettings size={36} />
              </motion.div>
              <div>
                <div className="admin-title-row">
                  <h1 className="page-title admin-page-title">Admin Control Center</h1>
                  <span className="admin-badge-large">ADMIN</span>
                </div>
                <p className="page-subtitle">
                  <FiShield size={13} /> Logged in as {user?.username} · {today}
                </p>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <motion.button className="icon-btn" onClick={() => { fetchTransactions(); fetchUsers() }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} title="Refresh">
              <FiRefreshCw size={16} className={loading ? 'spin' : ''} />
            </motion.button>
            <motion.button className="icon-btn" onClick={handleExportCSV} whileHover={{ scale: 1.08 }} title="Export">
              <FiDownload size={16} />
            </motion.button>
          </div>
        </div>

        <div className="tab-nav admin-tab-nav">
          {[
            { key: 'overview', label: 'Overview', icon: FiActivity },
            { key: 'users', label: 'All Users', icon: FiUsers },
            { key: 'transactions', label: 'All Transactions', icon: FiList },
            { key: 'analytics', label: 'Analytics', icon: FiBarChart2 },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key}
              className={`tab-btn admin-tab ${activeTab === key ? 'tab-active admin-tab-active' : ''}`}
              onClick={() => setSearchParams(key === 'overview' ? {} : { tab: key })}>
              <Icon size={15} /><span>{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="admin-stats-grid">
                <AdminStatCard label="Total Users" value={usersLoading ? '...' : allUsers.length}
                  icon={FiUsers} gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" delay={0} />
                <AdminStatCard label="Total Transactions" value={loading ? '...' : allTransactions.length}
                  icon={FiList} gradient="linear-gradient(135deg, #f7971e 0%, #ffd200 100%)" delay={0.1} />
                <AdminStatCard label="Total Income" value={loading ? '...' : `₹${totalIncome.toLocaleString('en-IN')}`}
                  icon={FiActivity} gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" delay={0.2} />
                <AdminStatCard label="Total Expense" value={loading ? '...' : `₹${totalExpense.toLocaleString('en-IN')}`}
                  icon={FiBarChart2} gradient="linear-gradient(135deg, #eb3349 0%, #f45c43 100%)" delay={0.3} />
              </div>
              <div className="charts-grid">
                <IncomeExpenseBarChart transactions={allTransactions} />
                <CategoryPieChart transactions={allTransactions} />
              </div>
              <FinancialInsights transactions={allTransactions} />
              <div className="section-header">
                <h2 className="section-title">Registered Users</h2>
                <button className="view-all-btn" onClick={() => setSearchParams({ tab: 'users' })}>View All →</button>
              </div>
              <div className="users-preview-grid">
                {allUsers.slice(0, 6).map((u, i) => (
                  <motion.div key={u.id || i} className="user-preview-card"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                    <div className="user-avatar-lg">{(u.username || '?').charAt(0).toUpperCase()}</div>
                    <p className="user-card-name">{u.username}</p>
                    <p className="user-card-email">{u.role}</p>
                    <p className="user-card-count">
                      {allTransactions.filter((t) => t.username === u.username).length} transactions
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="section-header">
                <h2 className="section-title">All Registered Users</h2>
                <span className="badge-count">{allUsers.length} users</span>
              </div>
              {usersLoading ? (
                <div className="loading-cards">{[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}</div>
              ) : (
                <div className="users-full-grid">
                  {allUsers.map((u, i) => {
                    const userTxns = allTransactions.filter((t) => t.username === u.username)
                    const userIncome = userTxns.filter((t) => String(t.type || '').toUpperCase() === 'INCOME').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
                    const userExpense = userTxns.filter((t) => String(t.type || '').toUpperCase() === 'EXPENSE').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
                    const isAdminUser = u.role === 'ADMIN'
                    return (
                      <motion.div key={u.id || i} className="user-full-card"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(102,126,234,0.2)' }}>
                        <div className="user-full-header">
                          <div className="user-avatar-xl">{(u.username || '?').charAt(0).toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <h3 className="user-full-name">{u.username}</h3>
                            <span className={`user-role-badge ${isAdminUser ? 'badge-admin' : 'badge-user'}`}>
                              {u.role}
                            </span>
                          </div>
                          {!isAdminUser && (
                            <motion.button
                              className="action-btn delete-btn delete-user-btn"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              title={`Delete user ${u.username}`}>
                              <FiUserX size={16} />
                            </motion.button>
                          )}
                        </div>
                        <div className="user-full-stats">
                          <div className="user-stat">
                            <span className="user-stat-val">{userTxns.length}</span>
                            <span className="user-stat-lbl">Transactions</span>
                          </div>
                          <div className="user-stat">
                            <span className="user-stat-val income-color">₹{(userIncome / 1000).toFixed(0)}K</span>
                            <span className="user-stat-lbl">Income</span>
                          </div>
                          <div className="user-stat">
                            <span className="user-stat-val expense-color">₹{(userExpense / 1000).toFixed(0)}K</span>
                            <span className="user-stat-lbl">Expense</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  {allUsers.length === 0 && (
                    <div className="empty-state-full">
                      <p className="empty-icon">👥</p><p>No users found</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="section-header">
                <h2 className="section-title">All Transactions</h2>
                <span className="badge-count">{allTransactions.length} total</span>
              </div>
              {loading ? <div className="skeleton-table" /> : (
                <TransactionTable transactions={allTransactions} onDelete={handleDeleteTransaction} isAdmin={true} />
              )}
            </motion.div>
          )}

          {/* ANALYTICS */}
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
                <h3 className="analytics-title">Per-User Transaction Summary</h3>
                <div className="user-breakdown-table">
                  <table className="transaction-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Username</th><th>Role</th>
                        <th>Transactions</th><th>Total Income</th><th>Total Expense</th><th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u, i) => {
                        const txns = allTransactions.filter((t) => t.username === u.username)
                        const inc = txns.filter((t) => String(t.type || '').toUpperCase() === 'INCOME').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
                        const exp = txns.filter((t) => String(t.type || '').toUpperCase() === 'EXPENSE').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
                        const bal = inc - exp
                        return (
                          <tr key={u.id || u.username} className="table-row">
                            <td className="row-num">{i + 1}</td>
                            <td>
                              <div className="user-chip">
                                <div className="user-avatar-sm">{u.username.charAt(0).toUpperCase()}</div>
                                <span>{u.username}</span>
                              </div>
                            </td>
                            <td><span className={`user-role-badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>{u.role}</span></td>
                            <td>{txns.length}</td>
                            <td><span className="income-amt">₹{inc.toLocaleString('en-IN')}</span></td>
                            <td><span className="expense-amt">₹{exp.toLocaleString('en-IN')}</span></td>
                            <td><span className={bal >= 0 ? 'income-amt' : 'expense-amt'}>{bal >= 0 ? '+' : ''}₹{bal.toLocaleString('en-IN')}</span></td>
                          </tr>
                        )
                      })}
                      {allUsers.length === 0 && (
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
    </div>
  )
}
