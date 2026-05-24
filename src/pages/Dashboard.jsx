import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiRefreshCw, FiDownload, FiCalendar, FiFileText, FiX } from 'react-icons/fi'
import { MdWavingHand } from 'react-icons/md'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import SummaryCards from '../components/SummaryCards'
import TransactionTable from '../components/TransactionTable'
import TransactionForm from '../components/TransactionForm'
import { IncomeExpenseBarChart, CategoryPieChart, FinancialInsights, MonthlyBreakdown, SpendingForecast, FinancialHealthScore } from '../components/Charts'
import { useAuth } from '../context/AuthContext'
import API from '../api/axiosConfig'
import { checkBudgetAlert } from '../utils/budgetAlert'
import { exportReport } from '../utils/pdfExport'

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Good Morning'
  if (h >= 12 && h < 17) return 'Good Afternoon'
  if (h >= 17 && h < 21) return 'Good Evening'
  return 'Good Night'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 768)
  const [activeTab, setActiveTab] = useState('overview')

  // PDF report modal state
  const now = new Date()
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfType, setPdfType] = useState('monthly')
  const [pdfMonth, setPdfMonth] = useState(now.getMonth() + 1)
  const [pdfYear, setPdfYear] = useState(now.getFullYear())
  const [pdfExtraData, setPdfExtraData] = useState(null)
  const [pdfFetching, setPdfFetching] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfIncludes, setPdfIncludes] = useState({
    transactions: true,
    categoryBreakdown: true,
    monthlySummary: true,
    savingsGoals: true,
    emiLoans: true,
    recurringTransactions: true,
  })

  const availableYears = [...new Set(
    transactions.map((t) => t.date ? new Date(t.date + 'T00:00:00').getFullYear() : null).filter(Boolean)
  ), now.getFullYear()].sort((a, b) => b - a)

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

  const handleExportCSV = async () => {
    if (!transactions.length) { toast.error('No data to export'); return }
    const toastId = toast.loading('Preparing CSV…')
    let emiLoans = [], savingsGoals = [], recurringTransactions = []
    try {
      const [emi, savings, recurring] = await Promise.all([
        API.get('/emi'), API.get('/savings-goals'), API.get('/recurring'),
      ])
      emiLoans = emi.data || []
      savingsGoals = savings.data || []
      recurringTransactions = recurring.data || []
    } catch { /* include what we have */ }

    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const row = (arr) => arr.map(cell).join(',')
    const lines = []

    // User info header
    lines.push(row(['ACCOUNT INFORMATION']))
    lines.push(row(['Username', 'Full Name', 'Email', 'Mobile', 'Exported On']))
    lines.push(row([
      user?.username || '',
      user?.fullName || '',
      user?.email    || '',
      user?.phone    || '',
      new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    ]))
    lines.push('')

    lines.push(row(['TRANSACTIONS']), row(['Date', 'Type', 'Category', 'Description', 'Amount']))
    transactions.forEach((t) => lines.push(row([t.date, t.type, t.category, t.description, t.amount])))
    lines.push('')

    if (savingsGoals.length > 0) {
      lines.push(row(['SAVINGS GOALS']), row(['Title', 'Target Amount', 'Saved Amount', 'Progress %', 'Deadline']))
      savingsGoals.forEach((g) => {
        const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0
        lines.push(row([g.title, g.targetAmount, g.savedAmount, `${pct}%`, g.deadline || 'No deadline']))
      })
      lines.push('')
    }

    if (emiLoans.length > 0) {
      lines.push(row(['EMI LOANS']), row(['Loan Name', 'Principal', 'Interest Rate', 'EMI/Month', 'Paid Months', 'Tenure', 'Outstanding', 'Next Due']))
      emiLoans.forEach((l) => lines.push(row([
        l.loanName, l.principal, `${l.interestRate}%`, l.emiAmount,
        `${l.paidMonths}/${l.tenureMonths}`, l.tenureMonths, l.remainingBalance, l.nextDueDate || 'Completed',
      ])))
      lines.push('')
    }

    if (recurringTransactions.length > 0) {
      lines.push(row(['RECURRING TRANSACTIONS']), row(['Type', 'Category', 'Amount', 'Description', 'Frequency', 'Day of Month', 'Active']))
      recurringTransactions.forEach((r) => lines.push(row([
        r.type, r.category, r.amount, r.description || '', r.frequency, r.dayOfMonth, r.active ? 'Yes' : 'No',
      ])))
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BudgetPro_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.dismiss(toastId)
    toast.success('Exported as CSV!')
  }

  const openEdit = (t) => { setEditData(t); setShowForm(true) }
  const openAdd = () => { setEditData(null); setShowForm(true) }

  const openPdfModal = async () => {
    setShowPdfModal(true)
    setPdfExtraData(null)
    setPdfFetching(true)
    try {
      const [emi, savings, recurring] = await Promise.all([
        API.get('/emi'),
        API.get('/savings-goals'),
        API.get('/recurring'),
      ])
      setPdfExtraData({
        emiLoans: emi.data || [],
        savingsGoals: savings.data || [],
        recurringTransactions: recurring.data || [],
      })
    } catch {
      setPdfExtraData({ emiLoans: [], savingsGoals: [], recurringTransactions: [] })
    } finally {
      setPdfFetching(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!transactions.length) { toast.error('No transactions to export'); return }
    setPdfGenerating(true)
    try {
      exportReport({
        type: pdfType,
        month: pdfMonth,
        year: pdfYear,
        transactions,
        user,
        includes: pdfIncludes,
        ...(pdfExtraData || {}),
      })
      setShowPdfModal(false)
      toast.success('Report downloaded!')
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setPdfGenerating(false)
    }
  }
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
            <motion.button className="icon-btn" onClick={openPdfModal}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} title="Download Report">
              <FiFileText size={16} />
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
              <div className="charts-grid">
                <SpendingForecast transactions={transactions} />
                <FinancialHealthScore transactions={transactions} />
              </div>
              <MonthlyBreakdown transactions={transactions} />
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

      {/* PDF Report Modal */}
      <AnimatePresence>
        {showPdfModal && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPdfModal(false)}>
            <motion.div className="modal-card" style={{ maxWidth: 420 }}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}>

              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="modal-title-icon"><FiFileText size={20} /></div>
                  <div>
                    <h2 className="modal-title">Download Report</h2>
                    <p className="modal-sub">Select type and period</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowPdfModal(false)}><FiX size={18} /></button>
              </div>

              <div className="modal-form" style={{ gap: 18 }}>
                {/* Report type */}
                <div className="form-group">
                  <label>Report Type</label>
                  <div className="type-toggle">
                    <button type="button"
                      className={`toggle-btn ${pdfType === 'monthly' ? 'toggle-income-active' : ''}`}
                      onClick={() => setPdfType('monthly')}>
                      📅 Monthly
                    </button>
                    <button type="button"
                      className={`toggle-btn ${pdfType === 'yearly' ? 'toggle-income-active' : ''}`}
                      onClick={() => setPdfType('yearly')}>
                      📆 Yearly
                    </button>
                  </div>
                </div>

                {/* Period selectors */}
                <div className="form-group">
                  <label>Period</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {pdfType === 'monthly' && (
                      <select style={{ flex: 2 }} className="pdf-period-select"
                        value={pdfMonth} onChange={(e) => setPdfMonth(Number(e.target.value))}>
                        {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    )}
                    <select style={{ flex: 1 }} className="pdf-period-select"
                      value={pdfYear} onChange={(e) => setPdfYear(Number(e.target.value))}>
                      {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {/* What's included — toggleable chips */}
                <div className="form-group">
                  <label>Include in Report</label>
                  <div className="pdf-includes-chips">
                    {[
                      { key: 'transactions',         label: 'Transactions' },
                      { key: 'categoryBreakdown',    label: 'Category Breakdown' },
                      ...(pdfType === 'yearly' ? [{ key: 'monthlySummary', label: 'Monthly Summary' }] : []),
                      { key: 'savingsGoals',         label: 'Savings Goals' },
                      { key: 'emiLoans',             label: 'EMI Loans' },
                      { key: 'recurringTransactions',label: 'Recurring' },
                    ].map(({ key, label }) => {
                      const on = pdfIncludes[key]
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPdfIncludes((p) => ({ ...p, [key]: !p[key] }))}
                          className={`pdf-chip pdf-chip-toggle ${on ? 'pdf-chip-on' : 'pdf-chip-off'}`}
                        >
                          {on ? '✓' : '✕'} {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* User info preview */}
                <div className="pdf-user-preview">
                  <span className="pdf-user-label">Account in report:</span>
                  <span className="pdf-user-val">
                    {user?.fullName || user?.username}
                    {user?.id && <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>#{user.id}</span>}
                  </span>
                </div>

                {pdfFetching && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Fetching your data…
                  </p>
                )}

                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setShowPdfModal(false)}>Cancel</button>
                  <motion.button
                    className="btn-submit btn-income"
                    onClick={handleDownloadPDF}
                    disabled={pdfFetching || pdfGenerating}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <FiFileText size={15} />
                    {pdfGenerating ? 'Generating…' : 'Download PDF'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
