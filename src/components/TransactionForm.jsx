import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSave, FiPlusCircle, FiDollarSign, FiTag, FiCalendar, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { validateAmount } from '../utils/validators'

const INCOME_CATEGORIES = [
  'Salary', 'Business', 'Investment', 'Freelance',
  'Rental Income', 'Dividends', 'Bonus', 'RD', 'FD', 'Other',
]
const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Education', 'Rent', 'Utilities', 'Other',
]

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate()
}

function todayParts() {
  const d = new Date()
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() }
}

function parseDateParts(dateStr) {
  if (!dateStr) return todayParts()
  const d = new Date(dateStr + 'T00:00:00')
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() }
}

function buildDateString(day, month, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i)

const emptyForm = {
  amount: '',
  type: 'INCOME',
  category: INCOME_CATEGORIES[0],
  description: '',
  ...todayParts(),
}

export default function TransactionForm({ onSubmit, onClose, editData }) {
  const [form, setForm] = useState(emptyForm)
  const isEdit = !!editData

  useEffect(() => {
    if (editData) {
      const parts = parseDateParts(editData.date)
      setForm({
        amount: editData.amount || '',
        type: editData.type || 'INCOME',
        category: editData.category || 'Food',
        description: editData.description || '',
        ...parts,
      })
    } else {
      setForm({ ...emptyForm, ...todayParts() })
    }
  }, [editData])

  const maxDay = daysInMonth(form.month, form.year)
  const safeDay = Math.min(form.day, maxDay)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: name === 'day' || name === 'month' || name === 'year' ? Number(value) : value }
      const newMax = daysInMonth(updated.month, updated.year)
      if (updated.day > newMax) updated.day = newMax
      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const amtError = validateAmount(form.amount)
    if (amtError) { toast.error(amtError); return }
    if (!form.category) { toast.error('Please select a category'); return }
    const desc = (form.description || '').trim()
    if (desc.length > 200) { toast.error('Description must not exceed 200 characters'); return }
    const dateStr = buildDateString(safeDay, form.month, form.year)
    const today = new Date(); today.setHours(23, 59, 59, 999)
    if (new Date(dateStr) > today) { toast.error('Date cannot be in the future'); return }
    onSubmit({ amount: Number(form.amount), type: form.type, category: form.category, description: desc, date: dateStr })
  }

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-card"
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-title-icon">
                {isEdit ? <FiSave size={20} /> : <FiPlusCircle size={20} />}
              </div>
              <div>
                <h2 className="modal-title">{isEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
                <p className="modal-sub">Fill in the details below</p>
              </div>
            </div>
            <button className="modal-close" onClick={onClose}><FiX size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            {/* Type toggle */}
            <div className="form-group">
              <label>Transaction Type</label>
              <div className="type-toggle">
                <button type="button" className={`toggle-btn ${form.type === 'INCOME' ? 'toggle-income-active' : ''}`}
                  onClick={() => setForm({ ...form, type: 'INCOME', category: INCOME_CATEGORIES[0] })}>
                  📈 Income
                </button>
                <button type="button" className={`toggle-btn ${form.type === 'EXPENSE' ? 'toggle-expense-active' : ''}`}
                  onClick={() => setForm({ ...form, type: 'EXPENSE', category: EXPENSE_CATEGORIES[0] })}>
                  📉 Expense
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label><FiDollarSign size={14} /> Amount (₹)</label>
              <div className="form-input-wrap">
                <span className="input-prefix">₹</span>
                <input type="number" name="amount" placeholder="0.00" value={form.amount}
                  onChange={handleChange} min="0" step="0.01" required />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label><FiTag size={14} /> Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {(form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label><FiFileText size={14} /> Description</label>
              <input type="text" name="description" placeholder="What was this for? (optional)"
                value={form.description} onChange={handleChange} maxLength={200} />
              {form.description.length > 150 && (
                <span className="char-counter" style={{ color: form.description.length >= 200 ? '#ff6b6b' : '#aaa' }}>
                  {form.description.length}/200
                </span>
              )}
            </div>

            {/* Date — Day / Month / Year dropdowns */}
            <div className="form-group">
              <label><FiCalendar size={14} /> Date</label>
              <div className="date-dropdowns">
                <select name="day" value={safeDay} onChange={handleChange} className="date-select date-day">
                  {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                  ))}
                </select>
                <select name="month" value={form.month} onChange={handleChange} className="date-select date-month">
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select name="year" value={form.year} onChange={handleChange} className="date-select date-year">
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <span className="date-preview-text">
                {String(safeDay).padStart(2, '0')} {MONTHS.find(m => m.value === form.month)?.label} {form.year}
              </span>
            </div>

            {/* Preview */}
            <div className={`form-preview ${form.type === 'INCOME' ? 'preview-income' : 'preview-expense'}`}>
              <span>Preview:</span>
              <strong>
                {form.type === 'INCOME' ? '+' : '-'}₹{form.amount || '0'} · {form.category}
              </strong>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <motion.button
                type="submit"
                className={`btn-submit ${form.type === 'INCOME' ? 'btn-income' : 'btn-expense'}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isEdit ? <><FiSave size={16} /> Update</> : <><FiPlusCircle size={16} /> Add Transaction</>}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
