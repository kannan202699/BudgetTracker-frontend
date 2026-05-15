import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiRefreshCw, FiDownload, FiCalendar } from 'react-icons/fi'
import { MdWavingHand } from 'react-icons/md'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import SummaryCards from '../components/SummaryCards'
import TransactionTable from '../components/TransactionTable'
import TransactionForm from '../components/TransactionForm'
import { IncomeExpenseBarChart, CategoryPieChart, FinancialInsights } from '../components/Charts'
import { useAuth } from '../context/AuthContext'
import API from '../api/axiosConfig'
import { checkBudgetAlert } from '../utils/budgetAlert'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await API.get('/transactions/all')
      setTransactions(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleAdd = async (formData) => {
    try {
      await API.post('/transactions', formData)
      toast.success('Transaction added successfully!')
      setShowForm(false)
      await checkBudgetAlert(formData, transactions)
      fetchTransactions()
    } catch {
      toast.error('Failed to add transaction')
    }
  }

  const handleEdit = async (formData) => {
    try {
      await API.put(`/transactions/${editData.id}`, formData)
      toast.success('Transaction updated!')
      setEditData(null)
      setShowForm(false)
      fetchTransactions()
    } catch {
      toast.error('Failed to update transaction')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return
    try {
      await API.delete(`/transactions/${id}`)
      toast.success('Transaction deleted')
      fetchTransactions()
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  const handleExportCSV = () => {
    if (!transactions.length) { toast.error('No data to export'); return }
    const headers = ['Category', 'Description', 'Amount', 'Type', 'Date']
    const rows = transactions.map((t) => [t.category, t.description, t.amount, t.type, t.date])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    toast.success('Exported as CSV!')
  }

  const openEdit = (t) => { setEditData(t); setShowForm(true) }
  const openAdd = () => { setEditData(null); setShowForm(true) }
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <div className="page-header">
          <div className="header-left">
            <div className="welcome-wrap">
              <motion.span className="wave-icon"
                animate={{ rotate: [0, 20, -10, 20, 0] }}
                transition={{ duration: 1.5, delay: 1, repeat: Infinity, repeatDelay: 5 }}>
                <MdWavingHand size={28} />
              </motion.span>
              <div>
                <h1 className="page-title">{getGreeting()}, {user?.username}!</h1>
                <p className="page-subtitle"><FiCalendar size={13} /> {today}</p>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <motion.button className="icon-btn" onClick={fetchTransactions}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} title="Refresh">
              <FiRefreshCw size={16} className={loading ? 'spin' : ''} />
            </motion.button>
            <motion.button className="icon-btn" onClick={handleExportCSV}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} title="Export CSV">
              <FiDownload size={16} />
            </motion.button>
            <motion.button className="primary-btn" onClick={openAdd}
              whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <FiPlus size={18} /><span>Add Transaction</span>
            </motion.button>
          </div>
        </div>

        <div className="tab-nav">
          {['overview', 'transactions', 'analytics'].map((tab) => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              {loading ? (
                <div className="loading-cards">{[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)}</div>
              ) : (
                <SummaryCards transactions={transactions} />
              )}
              <div className="charts-grid">
                <IncomeExpenseBarChart transactions={transactions} />
                <CategoryPieChart transactions={transactions} />
              </div>
              <FinancialInsights transactions={transactions} />
              <div className="section-header">
                <h2 className="section-title">Recent Transactions</h2>
                <button className="view-all-btn" onClick={() => setActiveTab('transactions')}>View All →</button>
              </div>
              <TransactionTable transactions={transactions.slice(0, 5)} onEdit={openEdit} onDelete={handleDelete} />
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="section-header">
                <h2 className="section-title">All Transactions</h2>
                <span className="badge-count">{transactions.length} total</span>
              </div>
              {loading ? <div className="skeleton-table" /> : (
                <TransactionTable transactions={transactions} onEdit={openEdit} onDelete={handleDelete} />
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="section-header"><h2 className="section-title">Analytics</h2></div>
              <div className="charts-grid">
                <IncomeExpenseBarChart transactions={transactions} />
                <CategoryPieChart transactions={transactions} />
              </div>
              <FinancialInsights transactions={transactions} />
              <div className="analytics-section">
                <h3 className="analytics-title">Top Spending Categories</h3>
                <div className="category-breakdown">
                  {Object.entries(
                    transactions.filter((t) => t.type === 'EXPENSE')
                      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
                  )
                    .sort((a, b) => b[1] - a[1]).slice(0, 5)
                    .map(([cat, amt], i) => {
                      const total = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
                      const pct = total ? Math.round((amt / total) * 100) : 0
                      return (
                        <div key={cat} className="cat-row">
                          <div className="cat-info">
                            <span className="cat-rank">#{i + 1}</span>
                            <span className="cat-name">{cat}</span>
                          </div>
                          <div className="cat-bar-wrap">
                            <motion.div className="cat-bar" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ delay: i * 0.1, duration: 0.5 }} style={{ background: `hsl(${i * 60}, 70%, 55%)` }} />
                          </div>
                          <span className="cat-pct">{pct}%</span>
                          <span className="cat-amt">₹{amt.toLocaleString('en-IN')}</span>
                        </div>
                      )
                    })}
                  {transactions.filter((t) => t.type === 'EXPENSE').length === 0 && (
                    <p className="no-data">No expense data available</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showForm && (
          <TransactionForm
            onSubmit={editData ? handleEdit : handleAdd}
            onClose={() => { setShowForm(false); setEditData(null) }}
            editData={editData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
