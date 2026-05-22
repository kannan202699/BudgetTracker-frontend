import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiEdit2, FiTrash2, FiSearch, FiFilter,
  FiChevronLeft, FiChevronRight, FiArrowUp, FiArrowDown, FiCalendar
} from 'react-icons/fi'

const CATEGORIES = [
  'All',
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Rent', 'Utilities',
  'Salary', 'Business', 'Investment', 'Freelance', 'Rental Income', 'Dividends', 'Bonus', 'RD', 'FD',
  'Other',
]
const TYPES = ['All', 'INCOME', 'EXPENSE']
const PAGE_SIZE = 8

export default function TransactionTable({ transactions = [], onEdit, onDelete, isAdmin = false }) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  const filtered = transactions
    .filter((t) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        t.category?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.amount?.toString().includes(q) ||
        t.username?.toLowerCase().includes(q)
      const matchCat = filterCategory === 'All' || t.category === filterCategory
      const matchType = filterType === 'All' || t.type === filterType
      const txDate = t.date ? new Date(t.date + 'T00:00:00') : null
      const matchFrom = !dateFrom || (txDate && txDate >= new Date(dateFrom + 'T00:00:00'))
      const matchTo = !dateTo || (txDate && txDate <= new Date(dateTo + 'T23:59:59'))
      return matchSearch && matchCat && matchType && matchFrom && matchTo
    })
    .sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]
      if (sortField === 'date') { valA = new Date(valA); valB = new Date(valB) }
      if (sortField === 'amount') { valA = Number(valA); valB = Number(valB) }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const clearFilters = () => {
    setSearch(''); setFilterCategory('All'); setFilterType('All')
    setDateFrom(''); setDateTo(''); setPage(1)
  }

  const hasActiveFilters = search || filterCategory !== 'All' || filterType !== 'All' || dateFrom || dateTo

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FiArrowDown size={12} style={{ opacity: 0.3 }} />
    return sortDir === 'asc' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />
  }

  return (
    <div className="table-wrapper">
      {/* Primary filter row */}
      <div className="table-controls">
        <div className="search-box">
          <FiSearch size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by category, description, amount..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <div className="filter-group">
          <div className="filter-select-wrap">
            <FiFilter size={14} />
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="filter-select-wrap">
            <FiFilter size={14} />
            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <span className="result-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Date range filter row */}
      <div className="date-filter-row">
        <div className="date-filter-group">
          <FiCalendar size={14} className="date-filter-icon" />
          <span className="date-filter-label">From</span>
          <input
            type="date"
            className="date-filter-input"
            value={dateFrom}
            max={dateTo || new Date().toISOString().split('T')[0]}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          />
        </div>
        <div className="date-filter-group">
          <FiCalendar size={14} className="date-filter-icon" />
          <span className="date-filter-label">To</span>
          <input
            type="date"
            className="date-filter-input"
            value={dateTo}
            min={dateFrom}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          />
        </div>
        {hasActiveFilters && (
          <button className="clear-filter-btn" onClick={clearFilters} title="Clear all filters">
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-scroll">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>#</th>
              {isAdmin && <th>User</th>}
              <th className="sortable" onClick={() => toggleSort('category')}>
                Category <SortIcon field="category" />
              </th>
              <th>Description</th>
              <th className="sortable" onClick={() => toggleSort('amount')}>
                Amount <SortIcon field="amount" />
              </th>
              <th>Type</th>
              <th className="sortable" onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {paginated.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={isAdmin ? 8 : 7} className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No transactions found</p>
                    <span>Try adjusting your filters or add a new transaction</span>
                  </td>
                </motion.tr>
              ) : (
                paginated.map((t, idx) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.03 }}
                    className="table-row"
                  >
                    <td className="row-num">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    {isAdmin && (
                      <td>
                        <div className="user-chip">
                          <div className="user-avatar-sm">{t.username?.charAt(0).toUpperCase() || '?'}</div>
                          <span>{t.username || 'Unknown'}</span>
                        </div>
                      </td>
                    )}
                    <td><span className="category-badge">{t.category || '—'}</span></td>
                    <td className="desc-cell">{t.description || '—'}</td>
                    <td>
                      <span className={`amount-text ${t.type === 'INCOME' ? 'income-amt' : 'expense-amt'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className={`type-badge ${t.type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="date-cell">
                      {t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : '—'}
                    </td>
                    <td>
                      <div className="action-btns">
                        {!isAdmin && onEdit && (
                          <motion.button className="action-btn edit-btn" onClick={() => onEdit(t)}
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Edit">
                            <FiEdit2 size={14} />
                          </motion.button>
                        )}
                        <motion.button className="action-btn delete-btn" onClick={() => onDelete(t.id)}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Delete">
                          <FiTrash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <FiChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
              acc.push(p)
              return acc
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`dots-${idx}`} className="page-dots">…</span>
              ) : (
                <button key={item} className={`page-btn ${page === item ? 'page-active' : ''}`}
                  onClick={() => setPage(item)}>{item}</button>
              )
            )}
          <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
