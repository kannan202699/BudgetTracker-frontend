import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTarget, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import API from '../api/axiosConfig'

const emptyForm = { title: '', targetAmount: '', savedAmount: '', deadline: '' }

export default function SavingsGoalsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [goals, setGoals]                       = useState([])
  const [loading, setLoading]                   = useState(true)
  const [showModal, setShowModal]               = useState(false)
  const [editGoal, setEditGoal]                 = useState(null)
  const [form, setForm]                         = useState(emptyForm)
  const [submitting, setSubmitting]             = useState(false)

  // Deposit state: { goalId, amount }
  const [depositGoalId, setDepositGoalId]       = useState(null)
  const [depositAmount, setDepositAmount]       = useState('')
  const [depositing, setDepositing]             = useState(false)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await API.get('/savings-goals')
      setGoals(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast.error('Failed to load savings goals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const openAdd = () => { setEditGoal(null); setForm(emptyForm); setShowModal(true) }

  const openEdit = (goal) => {
    setEditGoal(goal)
    setForm({
      title:        goal.title,
      targetAmount: String(goal.targetAmount),
      savedAmount:  String(goal.savedAmount),
      deadline:     goal.deadline ? goal.deadline.slice(0, 10) : '',
    })
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditGoal(null); setForm(emptyForm) }

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const target = parseFloat(form.targetAmount)
    const saved  = parseFloat(form.savedAmount) || 0
    if (!form.title.trim())           { toast.error('Title is required'); return }
    if (isNaN(target) || target < 1)  { toast.error('Enter a valid target amount'); return }
    if (saved < 0)                    { toast.error('Saved amount cannot be negative'); return }

    const payload = { title: form.title.trim(), targetAmount: target, savedAmount: saved, deadline: form.deadline || null }

    setSubmitting(true)
    try {
      if (editGoal) {
        await API.put(`/savings-goals/${editGoal.id}`, payload)
        toast.success('Goal updated!')
      } else {
        await API.post('/savings-goals', payload)
        toast.success('Goal added!')
      }
      closeModal()
      fetchGoals()
    } catch {
      toast.error(editGoal ? 'Failed to update goal' : 'Failed to add goal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (goal) => {
    if (!window.confirm(`Delete "${goal.title}"?`)) return
    try {
      await API.delete(`/savings-goals/${goal.id}`)
      toast.success('Goal deleted')
      fetchGoals()
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  // Deposit money into a goal
  const openDeposit = (goal) => {
    setDepositGoalId(goal.id)
    setDepositAmount('')
  }

  const closeDeposit = () => { setDepositGoalId(null); setDepositAmount('') }

  const handleDeposit = async (goal) => {
    const amt = parseFloat(depositAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }

    const newSaved = goal.savedAmount + amt
    setDepositing(true)
    try {
      await API.put(`/savings-goals/${goal.id}`, {
        title:        goal.title,
        targetAmount: goal.targetAmount,
        savedAmount:  newSaved,
        deadline:     goal.deadline ? goal.deadline.slice(0, 10) : null,
      })
      toast.success(`₹${amt.toLocaleString('en-IN')} added to "${goal.title}"!`)
      closeDeposit()
      fetchGoals()
    } catch {
      toast.error('Failed to update goal')
    } finally {
      setDepositing(false)
    }
  }

  const formatDeadline = (deadline) => {
    if (!deadline) return null
    return new Date(deadline + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const due = new Date(deadline + 'T00:00:00')
    return Math.round((due - now) / (1000 * 60 * 60 * 24))
  }

  const getBarColor = (pct) => pct >= 100 ? '#ffd200' : '#38ef7d'

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>

        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Savings Goals</h1>
            <p className="page-subtitle">Track your financial targets</p>
          </div>
          <div className="header-actions">
            <motion.button className="primary-btn" onClick={openAdd} whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <FiPlus size={18} /> Add Goal
            </motion.button>
          </div>
        </div>

        {loading && (
          <div className="loading-cards">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton-card" style={{ height: 220 }} />)}
          </div>
        )}

        {!loading && goals.length === 0 && (
          <motion.div className="analytics-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="no-data" style={{ padding: '60px 0' }}>
              <FiTarget size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No savings goals yet. Add your first target!</p>
            </div>
          </motion.div>
        )}

        {!loading && goals.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 4 }}>
            {goals.map((goal, i) => {
              const pct           = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0
              const barColor      = getBarColor(pct)
              const deadlineFmt   = formatDeadline(goal.deadline)
              const daysRemaining = getDaysRemaining(goal.deadline)
              const isComplete    = pct >= 100
              const isDepositing  = depositGoalId === goal.id

              return (
                <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 20px 16px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* % badge */}
                  <span style={{ position: 'absolute', top: 14, right: 14, background: barColor, color: '#16162a', fontWeight: 800, fontSize: 12, borderRadius: 20, padding: '3px 10px' }}>
                    {isComplete ? '🎉 Done' : `${pct}%`}
                  </span>

                  {/* Title */}
                  <div style={{ paddingRight: 72 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: '#fff', margin: 0 }}>{goal.title}</p>
                    {deadlineFmt ? (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Due: {deadlineFmt}</p>
                    ) : (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No deadline</p>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="budget-bar-track">
                    <motion.div className="budget-bar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.7, ease: 'easeOut' }}
                      style={{ background: barColor }} />
                  </div>

                  {/* Amounts */}
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ color: barColor, fontWeight: 700 }}>₹{goal.savedAmount.toLocaleString('en-IN')}</span>
                    {' '}saved of{' '}
                    <span style={{ fontWeight: 600, color: '#fff' }}>₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                  </p>

                  {daysRemaining !== null && (
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: daysRemaining < 0 ? '#ff6b6b' : 'rgba(255,255,255,0.55)' }}>
                      {daysRemaining < 0 ? 'Overdue' : `${daysRemaining} days left`}
                    </p>
                  )}

                  {/* Deposit row (inline) */}
                  <AnimatePresence>
                    {isDepositing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 }}>
                          <div className="form-input-wrap" style={{ flex: 1, margin: 0 }}>
                            <span className="input-prefix">₹</span>
                            <input
                              type="number"
                              className="budget-edit-input"
                              placeholder="Amount to add"
                              min="1"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleDeposit(goal); if (e.key === 'Escape') closeDeposit() }}
                              autoFocus
                              style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: 13 }}
                            />
                          </div>
                          <motion.button onClick={() => handleDeposit(goal)} disabled={depositing}
                            whileTap={{ scale: 0.95 }}
                            style={{ background: 'rgba(56,239,125,0.18)', border: '1px solid rgba(56,239,125,0.3)', color: '#38ef7d', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FiCheck size={15} />
                          </motion.button>
                          <button onClick={closeDeposit}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 9, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FiX size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
                    {!isComplete && (
                      <motion.button
                        onClick={() => isDepositing ? closeDeposit() : openDeposit(goal)}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          background: 'rgba(56,239,125,0.12)', border: '1px solid rgba(56,239,125,0.25)',
                          color: '#38ef7d', borderRadius: 9, padding: '7px 12px', fontSize: 12,
                          fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <FiPlus size={13} />
                        Add Money
                      </motion.button>
                    )}
                    <button className="budget-edit-btn" title="Edit goal" onClick={() => openEdit(goal)} style={{ padding: '7px 10px' }}>
                      <FiEdit2 size={13} />
                    </button>
                    <button className="budget-clear-btn" title="Delete goal" onClick={() => handleDelete(goal)} style={{ padding: '7px 10px' }}>
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
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
                  <span className="modal-title-icon"><FiTarget size={18} /></span>
                  <div>
                    <h2 className="modal-title">{editGoal ? 'Edit Goal' : 'New Savings Goal'}</h2>
                    <p className="modal-sub">{editGoal ? 'Update your savings target' : 'Set a financial target to work towards'}</p>
                  </div>
                </div>
                <button className="modal-close" onClick={closeModal}><FiX size={18} /></button>
              </div>

              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Goal Title</label>
                  <div className="form-input-wrap">
                    <input type="text" name="title" className="budget-edit-input" placeholder="e.g. Emergency Fund, Vacation"
                      value={form.title} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} autoFocus />
                  </div>
                </div>

                <div className="form-group">
                  <label>Target Amount</label>
                  <div className="form-input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="targetAmount" className="budget-edit-input" placeholder="0" min="1"
                      value={form.targetAmount} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: 14 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Already Saved</label>
                  <div className="form-input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="savedAmount" className="budget-edit-input" placeholder="0" min="0"
                      value={form.savedAmount} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: 14 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Deadline <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>(optional)</span></label>
                  <div className="form-input-wrap">
                    <input type="date" name="deadline" className="budget-edit-input"
                      value={form.deadline} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeModal} disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn-submit btn-income" disabled={submitting}>
                    {submitting ? 'Saving…' : editGoal ? 'Save Changes' : 'Add Goal'}
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
