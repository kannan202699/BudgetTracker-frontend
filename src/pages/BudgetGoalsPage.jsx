import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiEdit2, FiCheck, FiX, FiTarget } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import API from '../api/axiosConfig'

const EXPENSE_CATS = [
  { name: 'Food',          icon: '🍔' },
  { name: 'Transport',     icon: '🚗' },
  { name: 'Shopping',      icon: '🛍️' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Health',        icon: '💊' },
  { name: 'Education',     icon: '📚' },
  { name: 'Rent',          icon: '🏠' },
  { name: 'Utilities',     icon: '💡' },
  { name: 'Other',         icon: '📦' },
]

export default function BudgetGoalsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [transactions, setTransactions]         = useState([])
  const [goals, setGoals]                       = useState({})
  const [editing, setEditing]                   = useState(null)
  const [editValue, setEditValue]               = useState('')
  const [saving, setSaving]                     = useState(false)

  const loadGoals = useCallback(() => {
    API.get('/budget/goals')
      .then((res) => setGoals(res.data || {}))
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadGoals()
    API.get('/transactions/all')
      .then((res) => setTransactions(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
  }, [loadGoals])

  const saveGoal = async (category) => {
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 1) { toast.error('Enter a valid amount (min ₹1)'); return }
    setSaving(true)
    try {
      await API.put(`/budget/goals/${encodeURIComponent(category)}`, { amount: val })
      setGoals((prev) => ({ ...prev, [category]: val }))
      setEditing(null)
      toast.success(`Budget set for ${category}!`)
    } catch {
      toast.error('Failed to save budget goal')
    } finally {
      setSaving(false)
    }
  }

  const clearGoal = async (category) => {
    try {
      await API.delete(`/budget/goals/${encodeURIComponent(category)}`)
      setGoals((prev) => {
        const next = { ...prev }
        delete next[category]
        return next
      })
    } catch {
      toast.error('Failed to clear budget goal')
    }
  }

  const now = new Date()
  const monthSpend = {}
  transactions
    .filter((t) => {
      if (!t.date) return false
      const d = new Date(t.date + 'T00:00:00')
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        String(t.type || '').toUpperCase() === 'EXPENSE'
      )
    })
    .forEach((t) => {
      monthSpend[t.category] = (monthSpend[t.category] || 0) + (parseFloat(t.amount) || 0)
    })

  const totalBudget  = Object.values(goals).reduce((s, v) => s + v, 0)
  const totalSpent   = Object.keys(goals).reduce((s, cat) => s + (monthSpend[cat] || 0), 0)
  const overallPct   = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0
  const overallColor = overallPct < 70 ? '#38ef7d' : overallPct < 100 ? '#ffd200' : '#ff6b6b'
  const monthLabel   = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Budget Goals</h1>
            <p className="page-subtitle">Set monthly spending limits · {monthLabel}</p>
          </div>
        </div>

        {/* Overall summary bar */}
        {totalBudget > 0 && (
          <motion.div className="budget-overview" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="budget-ov-stats">
              <div className="budget-ov-stat">
                <span className="budget-ov-lbl">Total Budget</span>
                <span className="budget-ov-val">₹{totalBudget.toLocaleString('en-IN')}</span>
              </div>
              <div className="budget-ov-stat">
                <span className="budget-ov-lbl">Spent This Month</span>
                <span className="budget-ov-val expense-color">₹{totalSpent.toLocaleString('en-IN')}</span>
              </div>
              <div className="budget-ov-stat">
                <span className="budget-ov-lbl">{totalBudget - totalSpent >= 0 ? 'Remaining' : 'Over by'}</span>
                <span className={`budget-ov-val ${totalBudget - totalSpent >= 0 ? 'income-color' : 'expense-color'}`}>
                  ₹{Math.abs(totalBudget - totalSpent).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="budget-ov-stat" style={{ flex: 2 }}>
                <span className="budget-ov-lbl">Overall Progress — {overallPct}%</span>
                <div className="budget-ov-bar-wrap">
                  <motion.div className="budget-ov-bar" initial={{ width: 0 }}
                    animate={{ width: `${overallPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ background: overallColor }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="budget-grid">
          {EXPENSE_CATS.map(({ name: cat, icon }, i) => {
            const budget   = goals[cat] || 0
            const spent    = monthSpend[cat] || 0
            const pct      = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
            const isOver   = budget > 0 && spent > budget
            const barColor = pct < 70 ? '#38ef7d' : pct < 100 ? '#ffd200' : '#ff6b6b'

            return (
              <motion.div key={cat} className="budget-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>

                <div className="budget-card-top">
                  <div className="budget-cat-info">
                    <span className="budget-cat-icon">{icon}</span>
                    <span className="budget-cat-name">{cat}</span>
                    {isOver && <span className="budget-over-badge">Over!</span>}
                  </div>
                  <div className="budget-card-actions">
                    <button className="budget-edit-btn" title="Set budget"
                      onClick={() => { setEditing(cat); setEditValue(budget > 0 ? String(budget) : '') }}>
                      <FiEdit2 size={12} />
                    </button>
                    {budget > 0 && (
                      <button className="budget-clear-btn" title="Clear budget" onClick={() => clearGoal(cat)}>
                        <FiX size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {editing === cat ? (
                  <div className="budget-edit-row">
                    <span className="budget-edit-prefix">₹</span>
                    <input
                      type="number"
                      className="budget-edit-input"
                      value={editValue}
                      autoFocus
                      placeholder="Monthly limit"
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveGoal(cat)
                        if (e.key === 'Escape') setEditing(null)
                      }}
                    />
                    <button className="budget-save-btn" onClick={() => saveGoal(cat)} disabled={saving}>
                      <FiCheck size={13} />
                    </button>
                    <button className="budget-discard-btn" onClick={() => setEditing(null)} disabled={saving}>
                      <FiX size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="budget-amounts">
                    <span className="budget-spent-val" style={{ color: isOver ? '#ff6b6b' : 'rgba(255,255,255,0.8)' }}>
                      ₹{spent.toLocaleString('en-IN')}
                    </span>
                    <span className="budget-limit-val">
                      {budget > 0 ? `/ ₹${budget.toLocaleString('en-IN')}` : '— no limit'}
                    </span>
                  </div>
                )}

                <div className="budget-bar-track">
                  <motion.div className="budget-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: budget > 0 ? `${pct}%` : '0%' }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.7, ease: 'easeOut' }}
                    style={{ background: barColor }} />
                </div>

                <div className="budget-card-footer">
                  {budget > 0 ? (
                    <>
                      <span className="budget-pct-label" style={{ color: barColor }}>{pct}%</span>
                      <span className="budget-remaining-label">
                        {isOver
                          ? `₹${(spent - budget).toLocaleString('en-IN')} over budget`
                          : `₹${(budget - spent).toLocaleString('en-IN')} remaining`}
                      </span>
                    </>
                  ) : (
                    <span className="budget-set-hint">
                      <FiTarget size={11} /> Click edit to set a budget
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
