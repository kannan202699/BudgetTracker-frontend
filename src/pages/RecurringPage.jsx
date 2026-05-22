import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiRepeat,
  FiToggleLeft, FiToggleRight, FiAlertCircle, FiCheck,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import API from '../api/axiosConfig'

const INCOME_CATEGORIES  = ['Salary','Business','Investment','Freelance','Rental Income','Dividends','Bonus','RD','FD','Other']
const EXPENSE_CATEGORIES = ['Food','Transport','Shopping','Entertainment','Health','Education','Rent','Utilities','Other']

const emptyForm = {
  type:       'EXPENSE',
  amount:     '',
  category:   '',
  description:'',
  frequency:  'MONTHLY',
  dayOfMonth: '1',
}

export default function RecurringPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [recurring, setRecurring]               = useState([])
  const [transactions, setTransactions]         = useState([])
  const [loading, setLoading]                   = useState(true)
  const [showModal, setShowModal]               = useState(false)
  const [editItem, setEditItem]                 = useState(null)
  const [form, setForm]                         = useState(emptyForm)
  const [submitting, setSubmitting]             = useState(false)
  const [loggingId, setLoggingId]               = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [recRes, txRes] = await Promise.all([
        API.get('/recurring'),
        API.get('/transactions/all'),
      ])
      setRecurring(Array.isArray(recRes.data) ? recRes.data : [])
      setTransactions(Array.isArray(txRes.data) ? txRes.data : [])
    } catch {
      toast.error('Failed to load recurring data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const now          = new Date()
  const currentMonth = now.getMonth()
  const currentYear  = now.getFullYear()

  const thisMonthTx = transactions.filter((t) => {
    if (!t.date) return false
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const dueThisMonth = recurring.filter((r) => {
    if (!r.active) return false
    const alreadyLogged = thisMonthTx.some(
      (t) =>
        String(t.type).toUpperCase()     === String(r.type).toUpperCase() &&
        String(t.category).toLowerCase() === String(r.category).toLowerCase() &&
        Math.abs(parseFloat(t.amount) - parseFloat(r.amount)) < 0.01
    )
    return !alreadyLogged
  })

  // Log a recurring item directly as a transaction
  const handleLogNow = async (item) => {
    setLoggingId(item.id)
    const today = now.toISOString().split('T')[0]
    try {
      await API.post('/transactions', {
        type:        item.type,
        category:    item.category,
        description: item.description || `${item.category} (recurring)`,
        amount:      parseFloat(item.amount),
        date:        today,
      })
      toast.success(`${item.category} logged as transaction!`)
      // Refresh transactions so "due this month" updates
      const txRes = await API.get('/transactions/all')
      setTransactions(Array.isArray(txRes.data) ? txRes.data : [])
    } catch {
      toast.error('Failed to log transaction')
    } finally {
      setLoggingId(null)
    }
  }

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      type:        item.type,
      amount:      String(item.amount),
      category:    item.category,
      description: item.description || '',
      frequency:   item.frequency,
      dayOfMonth:  String(item.dayOfMonth),
    })
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(emptyForm) }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'type') next.category = ''
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0)  { toast.error('Enter a valid amount'); return }
    if (!form.category)          { toast.error('Select a category'); return }
    const day = parseInt(form.dayOfMonth, 10)
    if (isNaN(day) || day < 1 || day > 31) { toast.error('Day of month must be 1–31'); return }

    const payload = {
      type:        form.type,
      amount:      amt,
      category:    form.category,
      description: form.description.trim(),
      frequency:   form.frequency,
      dayOfMonth:  day,
      active:      editItem ? editItem.active : true,
    }

    setSubmitting(true)
    try {
      if (editItem) {
        await API.put(`/recurring/${editItem.id}`, payload)
        toast.success('Recurring updated!')
      } else {
        await API.post('/recurring', payload)
        toast.success('Recurring added!')
      }
      closeModal()
      fetchAll()
    } catch {
      toast.error(editItem ? 'Failed to update' : 'Failed to add recurring')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.category}" recurring ${item.type.toLowerCase()}?`)) return
    try {
      await API.delete(`/recurring/${item.id}`)
      toast.success('Deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleToggleActive = async (item) => {
    try {
      await API.put(`/recurring/${item.id}`, { ...item, active: !item.active })
      setRecurring((prev) => prev.map((r) => r.id === item.id ? { ...r, active: !r.active } : r))
      toast.success(item.active ? 'Paused' : 'Activated')
    } catch {
      toast.error('Failed to update')
    }
  }

  const currentCategories = form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>

        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Recurring Transactions</h1>
            <p className="page-subtitle">Repeating income &amp; expenses — log them with one click</p>
          </div>
          <div className="header-actions">
            <motion.button className="primary-btn" onClick={openAdd} whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <FiPlus size={18} /> Add Recurring
            </motion.button>
          </div>
        </div>

        {loading && (
          <div className="loading-cards">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        )}

        {!loading && (
          <>
            {/* ── Due This Month ── */}
            <motion.div className="analytics-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <FiAlertCircle size={18} style={{ color: '#ffd200' }} />
                <h2 className="analytics-title" style={{ margin: 0 }}>Due This Month</h2>
                {dueThisMonth.length > 0 && (
                  <span style={{ background: 'rgba(255,210,0,0.15)', color: '#ffd200', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                    {dueThisMonth.length}
                  </span>
                )}
              </div>

              {dueThisMonth.length === 0 ? (
                <div className="no-data" style={{ padding: '28px 0' }}>
                  <FiCheck size={22} style={{ color: '#38ef7d', marginBottom: 6 }} />
                  <p>All recurring items are logged for this month.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {dueThisMonth.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        background:   item.type === 'INCOME' ? 'rgba(56,239,125,0.06)' : 'rgba(255,107,107,0.07)',
                        border:       item.type === 'INCOME' ? '1px solid rgba(56,239,125,0.18)' : '1px solid rgba(255,107,107,0.18)',
                        borderRadius: 14,
                        padding:      '14px 16px',
                        display:      'flex',
                        alignItems:   'center',
                        gap:          14,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 14 }}>{item.category}</p>
                        {item.description && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.description}</p>
                        )}
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                          {item.frequency} · Day {item.dayOfMonth}
                        </p>
                        <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 15, color: item.type === 'INCOME' ? '#38ef7d' : '#ff6b6b' }}>
                          {item.type === 'INCOME' ? '+' : '-'}₹{parseFloat(item.amount).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => handleLogNow(item)}
                        disabled={loggingId === item.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          background:   item.type === 'INCOME' ? 'rgba(56,239,125,0.18)' : 'rgba(255,107,107,0.18)',
                          border:       item.type === 'INCOME' ? '1px solid rgba(56,239,125,0.3)' : '1px solid rgba(255,107,107,0.3)',
                          color:        item.type === 'INCOME' ? '#38ef7d' : '#ff6b6b',
                          borderRadius: 10,
                          padding:      '8px 14px',
                          fontSize:     12,
                          fontWeight:   700,
                          cursor:       loggingId === item.id ? 'not-allowed' : 'pointer',
                          whiteSpace:   'nowrap',
                          opacity:      loggingId === item.id ? 0.6 : 1,
                          display:      'flex',
                          alignItems:   'center',
                          gap:          5,
                        }}
                      >
                        <FiCheck size={13} />
                        {loggingId === item.id ? 'Logging…' : 'Log Now'}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── All Recurring ── */}
            <motion.div className="analytics-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="analytics-title" style={{ marginBottom: 16 }}>All Recurring</h2>

              {recurring.length === 0 ? (
                <div className="no-data" style={{ padding: '40px 0' }}>
                  <FiRepeat size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p>No recurring transactions yet. Add your first one!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {['Type','Category','Amount','Frequency','Day','Active',''].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recurring.map((item, i) => (
                        <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' }}>
                          <td style={{ padding: '11px 12px' }}>
                            <span style={{ background: item.type === 'INCOME' ? 'rgba(56,239,125,0.15)' : 'rgba(255,107,107,0.15)', color: item.type === 'INCOME' ? '#38ef7d' : '#ff6b6b', borderRadius: 20, padding: '3px 10px', fontWeight: 700, fontSize: 11 }}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ padding: '11px 12px', color: '#fff', fontWeight: 600 }}>
                            {item.category}
                            {item.description && (
                              <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{item.description}</span>
                            )}
                          </td>
                          <td style={{ padding: '11px 12px', fontWeight: 700, color: item.type === 'INCOME' ? '#38ef7d' : '#ff6b6b' }}>
                            ₹{parseFloat(item.amount).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.65)' }}>{item.frequency}</td>
                          <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.65)' }}>{item.dayOfMonth}</td>
                          <td style={{ padding: '11px 12px' }}>
                            <button onClick={() => handleToggleActive(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0, color: item.active ? '#38ef7d' : 'rgba(255,255,255,0.25)' }} title={item.active ? 'Pause' : 'Activate'}>
                              {item.active ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                            </button>
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="budget-edit-btn" title="Edit" onClick={() => openEdit(item)} style={{ padding: '5px 8px' }}><FiEdit2 size={12} /></button>
                              <button className="budget-clear-btn" title="Delete" onClick={() => handleDelete(item)} style={{ padding: '5px 8px' }}><FiTrash2 size={12} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <motion.div className="modal-card"
              initial={{ opacity: 0, scale: 0.93, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

              <div className="modal-header">
                <div className="modal-title-group">
                  <span className="modal-title-icon"><FiRepeat size={18} /></span>
                  <div>
                    <h2 className="modal-title">{editItem ? 'Edit Recurring' : 'New Recurring'}</h2>
                    <p className="modal-sub">{editItem ? 'Update recurring transaction' : 'Set up a repeating income or expense'}</p>
                  </div>
                </div>
                <button className="modal-close" onClick={closeModal}><FiX size={18} /></button>
              </div>

              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Type</label>
                  <div className="type-toggle">
                    <button type="button" className={`toggle-btn ${form.type === 'INCOME' ? 'toggle-income-active' : ''}`}
                      onClick={() => setForm((p) => ({ ...p, type: 'INCOME', category: '' }))}>Income</button>
                    <button type="button" className={`toggle-btn ${form.type === 'EXPENSE' ? 'toggle-expense-active' : ''}`}
                      onClick={() => setForm((p) => ({ ...p, type: 'EXPENSE', category: '' }))}>Expense</button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <div className="form-input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="amount" className="budget-edit-input" placeholder="0" min="1"
                      value={form.amount} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: 14 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <div className="form-input-wrap">
                    <select name="category" value={form.category} onChange={handleChange} className="budget-edit-input"
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}>
                      <option value="">Select category…</option>
                      {currentCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>(optional)</span></label>
                  <div className="form-input-wrap">
                    <input type="text" name="description" className="budget-edit-input" placeholder="e.g. Monthly rent payment"
                      value={form.description} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Frequency</label>
                  <div className="form-input-wrap">
                    <select name="frequency" value={form.frequency} onChange={handleChange} className="budget-edit-input"
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}>
                      <option value="MONTHLY">Monthly</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Day of Month</label>
                  <div className="form-input-wrap">
                    <input type="number" name="dayOfMonth" className="budget-edit-input" placeholder="1" min="1" max="31"
                      value={form.dayOfMonth} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeModal} disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn-submit btn-income" disabled={submitting}>
                    {submitting ? 'Saving…' : editItem ? 'Save Changes' : 'Add Recurring'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
