import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiRefreshCw, FiDownload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import TransactionTable from '../components/TransactionTable'
import TransactionForm from '../components/TransactionForm'
import SummaryCards from '../components/SummaryCards'
import API from '../api/axiosConfig'
import { checkBudgetAlert } from '../utils/budgetAlert'

export default function TransactionsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)

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
      toast.success('Transaction added!')
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
      toast.success('Deleted')
      fetchTransactions()
    } catch {
      toast.error('Failed to delete')
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
    toast.success('Exported!')
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Transactions</h1>
            <p className="page-subtitle">Manage all your income and expenses</p>
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
            <motion.button className="primary-btn" onClick={() => { setEditData(null); setShowForm(true) }}
              whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <FiPlus size={18} /> Add Transaction
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="loading-cards">{[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)}</div>
        ) : (
          <SummaryCards transactions={transactions} />
        )}

        <div className="section-header" style={{ marginTop: 8 }}>
          <h2 className="section-title">All Transactions</h2>
          <span className="badge-count">{transactions.length} total</span>
        </div>

        {loading ? <div className="skeleton-table" /> : (
          <TransactionTable
            transactions={transactions}
            onEdit={(t) => { setEditData(t); setShowForm(true) }}
            onDelete={handleDelete}
          />
        )}
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
