import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiTrash2, FiX, FiCreditCard, FiCheck, FiRotateCcw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import API from '../api/axiosConfig'

const emptyForm = {
  loanName:     '',
  principal:    '',
  interestRate: '',
  tenureMonths: '',
  startDate:    '',
}

function calcEMI(principal, annualRate, tenureMonths) {
  const p = parseFloat(principal)
  const r = parseFloat(annualRate) / 12 / 100
  const n = parseInt(tenureMonths, 10)
  if (!p || !r || !n || isNaN(p) || isNaN(r) || isNaN(n)) return null
  if (r === 0) return p / n
  const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  return Math.round(emi * 100) / 100
}

function getBarColor(pct) {
  if (pct < 40) return '#38ef7d'
  if (pct < 75) return '#ffd200'
  return '#ff6b6b'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function EmiTrackerPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loans, setLoans]                       = useState([])
  const [loading, setLoading]                   = useState(true)
  const [showModal, setShowModal]               = useState(false)
  const [form, setForm]                         = useState(emptyForm)
  const [submitting, setSubmitting]             = useState(false)
  const [payingId, setPayingId]                 = useState(null)

  const fetchLoans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await API.get('/emi')
      setLoans(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast.error('Failed to load EMI data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLoans() }, [fetchLoans])

  const totalEMI         = loans.reduce((s, l) => s + (parseFloat(l.emiAmount) || 0), 0)
  const totalOutstanding = loans.reduce((s, l) => s + (parseFloat(l.remainingBalance) || 0), 0)

  const previewEMI = useMemo(
    () => calcEMI(form.principal, form.interestRate, form.tenureMonths),
    [form.principal, form.interestRate, form.tenureMonths]
  )

  const openAdd  = () => { setForm(emptyForm); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setForm(emptyForm) }
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.loanName.trim())                { toast.error('Loan name is required'); return }
    const p = parseFloat(form.principal)
    if (isNaN(p) || p <= 0)                  { toast.error('Enter a valid principal amount'); return }
    const r = parseFloat(form.interestRate)
    if (isNaN(r) || r <= 0)                  { toast.error('Enter a valid interest rate'); return }
    const n = parseInt(form.tenureMonths, 10)
    if (isNaN(n) || n <= 0)                  { toast.error('Enter a valid tenure in months'); return }
    if (!form.startDate)                     { toast.error('Select a start date'); return }

    setSubmitting(true)
    try {
      await API.post('/emi', { loanName: form.loanName.trim(), principal: p, interestRate: r, tenureMonths: n, startDate: form.startDate })
      toast.success('Loan added!')
      closeModal()
      fetchLoans()
    } catch {
      toast.error('Failed to add loan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkPaid = async (loan) => {
    if (loan.paidMonths >= loan.tenureMonths) { toast.error('All EMIs already marked paid'); return }
    setPayingId(loan.id)
    try {
      const res = await API.post(`/emi/${loan.id}/pay`)
      setLoans((prev) => prev.map((l) => l.id === loan.id ? res.data : l))
      toast.success(`EMI #${res.data.paidMonths} marked as paid!`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark payment')
    } finally {
      setPayingId(null)
    }
  }

  const handleUndoPay = async (loan) => {
    if (!loan.paidMonths || loan.paidMonths <= 0) { toast.error('No payments to undo'); return }
    setPayingId(loan.id)
    try {
      const res = await API.post(`/emi/${loan.id}/undo-pay`)
      setLoans((prev) => prev.map((l) => l.id === loan.id ? res.data : l))
      toast.success('Last payment undone')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to undo')
    } finally {
      setPayingId(null)
    }
  }

  const handleDelete = async (loan) => {
    if (!window.confirm(`Delete loan "${loan.loanName}"?`)) return
    try {
      await API.delete(`/emi/${loan.id}`)
      toast.success('Loan removed')
      fetchLoans()
    } catch {
      toast.error('Failed to delete loan')
    }
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>

        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">EMI Tracker</h1>
            <p className="page-subtitle">Track your loans and monthly installments</p>
          </div>
          <div className="header-actions">
            <motion.button className="primary-btn" onClick={openAdd} whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <FiPlus size={18} /> Add Loan
            </motion.button>
          </div>
        </div>

        {/* Summary strip */}
        {!loading && loans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total EMI / Month', value: `₹${totalEMI.toLocaleString('en-IN')}`,         color: '#ff6b6b' },
              { label: 'Total Outstanding', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, color: '#ffd200' },
              { label: 'Active Loans',      value: loans.length,                                    color: '#38ef7d' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: '1 1 180px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color }}>{value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {loading && (
          <div className="loading-cards">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton-card" style={{ height: 260 }} />)}
          </div>
        )}

        {!loading && loans.length === 0 && (
          <motion.div className="analytics-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="no-data" style={{ padding: '60px 0' }}>
              <FiCreditCard size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No loans tracked yet. Add your first loan to get started.</p>
            </div>
          </motion.div>
        )}

        {/* Loan cards */}
        {!loading && loans.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {loans.map((loan, i) => {
              const paid    = parseInt(loan.paidMonths, 10)  || 0
              const elapsed = parseInt(loan.monthsElapsed, 10) || 0
              const tenure  = parseInt(loan.tenureMonths, 10) || 1
              const pct     = Math.min(100, Math.round((paid / tenure) * 100))
              const barColor = getBarColor(pct)
              const isDone  = paid >= tenure
              const isBusy  = payingId === loan.id
              const isBehind = elapsed > paid

              return (
                <motion.div key={loan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Loan name + done badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 7, display: 'flex', alignItems: 'center', color: '#a78bfa' }}>
                      <FiCreditCard size={16} />
                    </span>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#fff', flex: 1 }}>{loan.loanName}</p>
                    {isDone && (
                      <span style={{ background: 'rgba(56,239,125,0.15)', border: '1px solid rgba(56,239,125,0.3)', color: '#38ef7d', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        PAID OFF
                      </span>
                    )}
                    {isBehind && !isDone && (
                      <span style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        BEHIND
                      </span>
                    )}
                  </div>

                  {/* EMI badge */}
                  <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 10, padding: '10px 14px', display: 'inline-block', alignSelf: 'flex-start' }}>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#ff6b6b' }}>
                      ₹{parseFloat(loan.emiAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>/month</span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        Paid: {paid}/{tenure} EMIs
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>
                        {isDone ? 'Completed' : `${pct}%`}
                      </span>
                    </div>
                    <div className="budget-bar-track">
                      <motion.div className="budget-bar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.1 + i * 0.05, duration: 0.7, ease: 'easeOut' }}
                        style={{ background: barColor }} />
                    </div>
                    {isBehind && !isDone && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#ff6b6b' }}>
                        Schedule: {elapsed} months passed — {elapsed - paid} payment{elapsed - paid !== 1 ? 's' : ''} behind
                      </p>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Outstanding</p>
                      <p style={{ margin: '3px 0 0', fontWeight: 700, fontSize: 14, color: '#ffd200' }}>
                        ₹{parseFloat(loan.remainingBalance || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Interest</p>
                      <p style={{ margin: '3px 0 0', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                        ₹{parseFloat(loan.totalInterest || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Due</p>
                      <p style={{ margin: '3px 0 0', fontWeight: 600, fontSize: 13, color: isDone ? '#38ef7d' : 'rgba(255,255,255,0.75)' }}>
                        {isDone ? 'Completed' : formatDate(loan.nextDueDate)}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Remaining</p>
                      <p style={{ margin: '3px 0 0', fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                        {Math.max(0, tenure - paid)} months
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    {!isDone ? (
                      <motion.button
                        onClick={() => handleMarkPaid(loan)}
                        disabled={isBusy}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          background: 'rgba(56,239,125,0.15)', border: '1px solid rgba(56,239,125,0.3)',
                          color: '#38ef7d', borderRadius: 10, padding: '8px 14px', fontSize: 13,
                          fontWeight: 600, cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        <FiCheck size={14} />
                        {isBusy ? 'Saving…' : 'Mark EMI Paid'}
                      </motion.button>
                    ) : (
                      <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#38ef7d', fontWeight: 600, padding: '8px 0' }}>
                        🎉 Loan fully paid off!
                      </div>
                    )}

                    {paid > 0 && (
                      <motion.button
                        onClick={() => handleUndoPay(loan)}
                        disabled={isBusy}
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        title="Undo last payment"
                        style={{
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 10px',
                          cursor: isBusy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <FiRotateCcw size={14} />
                      </motion.button>
                    )}

                    <motion.button
                      onClick={() => handleDelete(loan)}
                      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                      title="Delete loan"
                      style={{
                        background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)',
                        color: '#ff6b6b', borderRadius: 10, padding: '8px 10px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <FiTrash2 size={14} />
                    </motion.button>
                  </div>

                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      {/* Add Loan Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <motion.div className="modal-card"
              initial={{ opacity: 0, scale: 0.93, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

              <div className="modal-header">
                <div className="modal-title-group">
                  <span className="modal-title-icon"><FiCreditCard size={18} /></span>
                  <div>
                    <h2 className="modal-title">Add Loan</h2>
                    <p className="modal-sub">Track a new loan or EMI obligation</p>
                  </div>
                </div>
                <button className="modal-close" onClick={closeModal}><FiX size={18} /></button>
              </div>

              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Loan Name</label>
                  <div className="form-input-wrap">
                    <input type="text" name="loanName" className="budget-edit-input" placeholder="e.g. Home Loan, Car Loan"
                      value={form.loanName} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} autoFocus />
                  </div>
                </div>

                <div className="form-group">
                  <label>Principal Amount</label>
                  <div className="form-input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="principal" className="budget-edit-input" placeholder="0" min="1"
                      value={form.principal} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: 14 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Annual Interest Rate</label>
                  <div className="form-input-wrap" style={{ position: 'relative' }}>
                    <input type="number" name="interestRate" className="budget-edit-input" placeholder="0.00" min="0.01" step="0.01"
                      value={form.interestRate} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 36px 10px 14px', fontSize: 14 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, pointerEvents: 'none' }}>%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Tenure (months)</label>
                  <div className="form-input-wrap">
                    <input type="number" name="tenureMonths" className="budget-edit-input" placeholder="e.g. 240" min="1"
                      value={form.tenureMonths} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <div className="form-input-wrap">
                    <input type="date" name="startDate" className="budget-edit-input"
                      value={form.startDate} onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} />
                  </div>
                </div>

                {previewEMI !== null && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Estimated EMI</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#a78bfa' }}>
                      ₹{previewEMI.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month
                    </span>
                  </motion.div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeModal} disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn-submit btn-income" disabled={submitting}>
                    {submitting ? 'Adding…' : 'Add Loan'}
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
