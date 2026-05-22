import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { motion } from 'framer-motion'
import API from '../api/axiosConfig'

const COLORS = ['#667eea', '#11998e', '#eb3349', '#f7971e', '#764ba2', '#38ef7d', '#ffd200', '#00c6ff']

function formatCurrency(val) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`
  return `₹${val}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,15,35,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#fff',
      }}>
        {label && <p style={{ marginBottom: 4, color: '#aaa' }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: <strong>{typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function IncomeExpenseBarChart({ transactions = [] }) {
  const monthlyData = {}
  transactions.forEach((t) => {
    if (!t.date) return
    const month = new Date(t.date).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
    if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expense: 0 }
    const amt = parseFloat(t.amount) || 0
    if (String(t.type || '').toUpperCase() === 'INCOME') monthlyData[month].income += amt
    else monthlyData[month].expense += amt
  })

  const data = Object.values(monthlyData).slice(-6)

  return (
    <motion.div
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="chart-title">📊 Monthly Income vs Expense</h3>
      {data.length === 0 ? (
        <div className="chart-empty">No data to display</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCurrency} tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#aaa', fontSize: 12 }} />
            <Bar dataKey="income" name="Income" fill="#11998e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#eb3349" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}

export function CategoryPieChart({ transactions = [] }) {
  const catData = {}
  transactions.forEach((t) => {
    if (!t.category) return
    catData[t.category] = (catData[t.category] || 0) + (t.amount || 0)
  })

  const data = Object.entries(catData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <motion.div
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="chart-title">🥧 Spending by Category</h3>
      {data.length === 0 ? (
        <div className="chart-empty">No data to display</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: '#aaa', fontSize: 11 }}
              formatter={(value) => value.length > 10 ? value.slice(0, 10) + '…' : value}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}

export function FinancialInsights({ transactions = [] }) {
  const now = new Date()
  const curMonth = now.getMonth()
  const curYear = now.getFullYear()
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1
  const prevYear = curMonth === 0 ? curYear - 1 : curYear
  const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  let mIncome = 0, mExpense = 0, lmIncome = 0, lmExpense = 0
  transactions.forEach((t) => {
    if (!t.date) return
    const d = new Date(t.date + 'T00:00:00')
    const amt = parseFloat(t.amount) || 0
    const type = String(t.type || '').toUpperCase()
    const dm = d.getMonth(), dy = d.getFullYear()
    if (dm === curMonth && dy === curYear) {
      if (type === 'INCOME') mIncome += amt
      else if (type === 'EXPENSE') mExpense += amt
    } else if (dm === prevMonth && dy === prevYear) {
      if (type === 'INCOME') lmIncome += amt
      else if (type === 'EXPENSE') lmExpense += amt
    }
  })

  const mNet = mIncome - mExpense
  const savingsRate = mIncome > 0 ? Math.max(0, Math.min(100, Math.round((mNet / mIncome) * 100))) : 0
  const incomeChange = lmIncome > 0 ? Math.round(((mIncome - lmIncome) / lmIncome) * 100) : null
  const expenseChange = lmExpense > 0 ? Math.round(((mExpense - lmExpense) / lmExpense) * 100) : null

  const catSpend = {}
  transactions.filter((t) => String(t.type || '').toUpperCase() === 'EXPENSE').forEach((t) => {
    if (t.category) catSpend[t.category] = (catSpend[t.category] || 0) + (parseFloat(t.amount) || 0)
  })
  const topCats = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxAmt = topCats[0]?.[1] || 1

  const insightCards = []
  if (mIncome > 0 || mExpense > 0) {
    if (savingsRate >= 20) insightCards.push({ icon: '🎯', bg: 'rgba(56,239,125,0.1)', border: 'rgba(56,239,125,0.2)', title: 'Great savings!', text: `${savingsRate}% savings rate this month` })
    else if (savingsRate > 0) insightCards.push({ icon: '⚡', bg: 'rgba(255,210,0,0.1)', border: 'rgba(255,210,0,0.2)', title: 'Room to save', text: `${savingsRate}% saved — try to reach 20%+` })
    else insightCards.push({ icon: '🚨', bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.2)', title: 'Over budget!', text: 'Expenses exceed income this month' })
  }
  if (topCats[0]) insightCards.push({ icon: '📌', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)', title: 'Top spend', text: `${topCats[0][0]}: ₹${Number(topCats[0][1]).toLocaleString('en-IN')}` })
  if (incomeChange !== null) insightCards.push({ icon: incomeChange >= 0 ? '📈' : '📉', bg: incomeChange >= 0 ? 'rgba(56,239,125,0.1)' : 'rgba(255,107,107,0.1)', border: incomeChange >= 0 ? 'rgba(56,239,125,0.2)' : 'rgba(255,107,107,0.2)', title: 'Income trend', text: `${incomeChange >= 0 ? '+' : ''}${incomeChange}% vs last month` })
  if (expenseChange !== null) insightCards.push({ icon: expenseChange <= 0 ? '💚' : '⚠️', bg: expenseChange <= 0 ? 'rgba(56,239,125,0.1)' : 'rgba(255,165,0,0.1)', border: expenseChange <= 0 ? 'rgba(56,239,125,0.2)' : 'rgba(255,165,0,0.2)', title: 'Expense trend', text: `${expenseChange >= 0 ? '+' : ''}${expenseChange}% vs last month` })

  const r = 44
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (savingsRate / 100) * circumference
  const ringColor = savingsRate >= 20 ? '#38ef7d' : savingsRate > 0 ? '#ffd200' : '#ff6b6b'
  const CAT_COLORS = ['#667eea', '#38ef7d', '#f7971e', '#eb3349', '#a78bfa']

  function fmtAmt(val) {
    const v = Math.abs(val)
    if (v >= 100000) return `${(v / 100000).toFixed(1)}L`
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
    return v.toLocaleString('en-IN')
  }

  return (
    <motion.div className="chart-card chart-wide fi-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <div className="fi-header">
        <h3 className="chart-title" style={{ margin: 0 }}>💡 Financial Insights</h3>
        <span className="fi-month-badge">{monthName}</span>
      </div>

      <div className="fi-body">
        {/* Savings ring + monthly stats */}
        <div className="fi-left">
          <div className="fi-ring-wrap">
            <svg width={110} height={110} viewBox="0 0 110 110">
              <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
              <circle cx={55} cy={55} r={r} fill="none" stroke={ringColor} strokeWidth={10} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                transform="rotate(-90 55 55)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="fi-ring-center">
              <span className="fi-ring-pct">{savingsRate}%</span>
              <span className="fi-ring-lbl">Saved</span>
            </div>
          </div>
          <div className="fi-month-stats">
            {[
              { label: 'Income', val: `₹${fmtAmt(mIncome)}`, cls: 'income-color', change: incomeChange, upGood: true },
              { label: 'Expenses', val: `₹${fmtAmt(mExpense)}`, cls: 'expense-color', change: expenseChange, upGood: false },
              { label: 'Net Saved', val: `${mNet < 0 ? '-' : '+'}₹${fmtAmt(Math.abs(mNet))}`, cls: mNet >= 0 ? 'income-color' : 'expense-color', change: null },
            ].map((s) => (
              <div key={s.label} className="fi-stat">
                <span className="fi-stat-label">{s.label}</span>
                <span className={`fi-stat-val ${s.cls}`}>{s.val}</span>
                {s.change !== null && (
                  <span className={`fi-stat-change ${(s.upGood ? s.change >= 0 : s.change <= 0) ? 'change-up' : 'change-down'}`}>
                    {s.change >= 0 ? '↑' : '↓'} {Math.abs(s.change)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top spending categories */}
        <div className="fi-middle">
          <p className="fi-section-title">Top Spending Categories</p>
          {topCats.length === 0 ? (
            <p className="no-data" style={{ marginTop: 24 }}>No expense data yet</p>
          ) : (
            <div className="fi-cats">
              {topCats.map(([cat, amt], i) => (
                <div key={cat} className="fi-cat-row">
                  <span className="fi-cat-name">{cat}</span>
                  <div className="fi-cat-bar-wrap">
                    <motion.div className="fi-cat-bar"
                      initial={{ width: 0 }} animate={{ width: `${Math.round((amt / maxAmt) * 100)}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                      style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                  </div>
                  <span className="fi-cat-amt">₹{Number(amt).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart insight cards */}
        <div className="fi-right">
          <p className="fi-section-title">Smart Insights</p>
          <div className="fi-insight-cards">
            {insightCards.slice(0, 4).map((ic, i) => (
              <motion.div key={i} className="fi-insight-card"
                style={{ background: ic.bg, border: `1px solid ${ic.border}` }}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}>
                <span className="fi-insight-icon">{ic.icon}</span>
                <div>
                  <p className="fi-insight-title">{ic.title}</p>
                  <p className="fi-insight-text">{ic.text}</p>
                </div>
              </motion.div>
            ))}
            {insightCards.length === 0 && <p className="no-data">Add transactions to unlock insights</p>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function MonthlyBreakdown({ transactions = [] }) {
  const [showAll, setShowAll] = useState(false)

  const monthMap = {}
  transactions.forEach((t) => {
    if (!t.date) return
    const d = new Date(t.date + 'T00:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap[key]) {
      monthMap[key] = {
        key,
        label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
        income: 0,
        expense: 0,
      }
    }
    const amt = parseFloat(t.amount) || 0
    if (String(t.type || '').toUpperCase() === 'INCOME') monthMap[key].income += amt
    else monthMap[key].expense += amt
  })

  const rows = Object.values(monthMap).sort((a, b) => b.key.localeCompare(a.key))
  const visible = showAll ? rows : rows.slice(0, 6)

  function fmt(val) {
    const v = Math.abs(val)
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`
    return `₹${v.toLocaleString('en-IN')}`
  }

  return (
    <motion.div
      className="chart-card chart-wide"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="mb-header">
        <h3 className="chart-title" style={{ margin: 0 }}>📅 Monthly Breakdown</h3>
        {rows.length > 6 && (
          <button className="mb-toggle-btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less ↑' : `Show all ${rows.length} months ↓`}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="chart-empty">No transaction data yet</div>
      ) : (
        <div className="mb-list">
          <div className="mb-header-row">
            <span className="mb-col-month">Month</span>
            <span className="mb-col-num">Income</span>
            <span className="mb-col-num">Expense</span>
            <span className="mb-col-num">Net</span>
            <span className="mb-col-bar">Spend ratio</span>
          </div>

          {visible.map((row, i) => {
            const net = row.income - row.expense
            const spendPct = row.income > 0 ? Math.round((row.expense / row.income) * 100) : (row.expense > 0 ? 100 : 0)
            const isOver = row.expense > row.income
            const barColor = isOver ? '#ff6b6b' : spendPct > 80 ? '#ffd200' : '#38ef7d'

            return (
              <motion.div
                key={row.key}
                className="mb-row"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <span className="mb-col-month mb-month-label">{row.label}</span>
                <span className="mb-col-num income-color">{fmt(row.income)}</span>
                <span className="mb-col-num expense-color">{fmt(row.expense)}</span>
                <span className={`mb-col-num mb-net ${net >= 0 ? 'income-color' : 'expense-color'}`}>
                  {net >= 0 ? '+' : '-'}{fmt(net)}
                </span>
                <div className="mb-col-bar mb-bar-wrap">
                  <div className="mb-bar-track">
                    <motion.div
                      className="mb-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, spendPct)}%` }}
                      transition={{ delay: 0.1 + i * 0.04, duration: 0.6, ease: 'easeOut' }}
                      style={{ background: barColor }}
                    />
                  </div>
                  <span className="mb-bar-pct" style={{ color: barColor }}>
                    {row.income > 0 ? `${spendPct}%` : '—'}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

export function SpendingForecast({ transactions = [] }) {
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - dayOfMonth

  const monthExpenses = transactions.filter((t) => {
    if (!t.date) return false
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      && String(t.type || '').toUpperCase() === 'EXPENSE'
  })
  const monthIncome = transactions.filter((t) => {
    if (!t.date) return false
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      && String(t.type || '').toUpperCase() === 'INCOME'
  }).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)

  const spentSoFar = monthExpenses.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const dailyAvg = dayOfMonth > 0 ? spentSoFar / dayOfMonth : 0
  const projected = Math.round(dailyAvg * daysInMonth)
  const safeDaily = daysRemaining > 0 && monthIncome > spentSoFar
    ? Math.round((monthIncome - spentSoFar) / daysRemaining) : 0
  const projPct = monthIncome > 0 ? Math.min(100, Math.round((projected / monthIncome) * 100)) : 0
  const projColor = projPct < 80 ? '#38ef7d' : projPct < 100 ? '#ffd200' : '#ff6b6b'
  const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  function fmt(v) {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`
    return `₹${Math.round(v).toLocaleString('en-IN')}`
  }

  return (
    <motion.div className="chart-card forecast-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="forecast-header">
        <h3 className="chart-title" style={{ margin: 0 }}>🔮 Spending Forecast</h3>
        <span className="fi-month-badge">{monthLabel}</span>
      </div>
      <div className="forecast-body">
        <div className="forecast-stat-group">
          <div className="forecast-stat">
            <span className="forecast-lbl">Spent so far</span>
            <span className="forecast-val expense-color">{fmt(spentSoFar)}</span>
            <span className="forecast-sub">Day {dayOfMonth} of {daysInMonth}</span>
          </div>
          <div className="forecast-divider" />
          <div className="forecast-stat">
            <span className="forecast-lbl">Daily average</span>
            <span className="forecast-val" style={{ color: '#a78bfa' }}>{fmt(dailyAvg)}/day</span>
            <span className="forecast-sub">This month so far</span>
          </div>
          <div className="forecast-divider" />
          <div className="forecast-stat">
            <span className="forecast-lbl">Projected total</span>
            <span className="forecast-val" style={{ color: projColor }}>{fmt(projected)}</span>
            <span className="forecast-sub">{projPct}% of income</span>
          </div>
          <div className="forecast-divider" />
          <div className="forecast-stat">
            <span className="forecast-lbl">Safe daily limit</span>
            <span className="forecast-val income-color">{safeDaily > 0 ? `${fmt(safeDaily)}/day` : '—'}</span>
            <span className="forecast-sub">{daysRemaining} days left</span>
          </div>
        </div>
        <div className="forecast-bar-wrap">
          <div className="forecast-bar-labels">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹0</span>
            {monthIncome > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Income: {fmt(monthIncome)}</span>}
          </div>
          <div className="forecast-bar-track">
            <motion.div className="forecast-bar-actual" title={`Spent: ${fmt(spentSoFar)}`}
              initial={{ width: 0 }}
              animate={{ width: monthIncome > 0 ? `${Math.min(100, Math.round((spentSoFar / monthIncome) * 100))}%` : '0%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {monthIncome > 0 && projected > spentSoFar && (
              <motion.div className="forecast-bar-projected" title={`Projected: ${fmt(projected)}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, projPct) - Math.min(100, Math.round((spentSoFar / monthIncome) * 100))}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                style={{ background: projColor, opacity: 0.35 }}
              />
            )}
          </div>
          <div className="forecast-bar-legend">
            <span><span className="legend-dot" style={{ background: '#eb3349' }} /> Spent</span>
            <span><span className="legend-dot" style={{ background: projColor, opacity: 0.6 }} /> Projected</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function FinancialHealthScore({ transactions = [] }) {
  const [goals, setGoals] = useState({})
  useEffect(() => {
    API.get('/budget/goals').then((r) => setGoals(r.data || {})).catch(() => {})
  }, [])

  const now = new Date()
  let mIncome = 0, mExpense = 0, lmIncome = 0, lmExpense = 0
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

  transactions.forEach((t) => {
    if (!t.date) return
    const d = new Date(t.date + 'T00:00:00')
    const amt = parseFloat(t.amount) || 0
    const type = String(t.type || '').toUpperCase()
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      if (type === 'INCOME') mIncome += amt; else if (type === 'EXPENSE') mExpense += amt
    } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
      if (type === 'INCOME') lmIncome += amt; else if (type === 'EXPENSE') lmExpense += amt
    }
  })

  const savingsRate = mIncome > 0 ? Math.max(0, (mIncome - mExpense) / mIncome) : 0
  const savingsScore = savingsRate >= 0.20 ? 35 : savingsRate >= 0.10 ? 25 : savingsRate > 0 ? 12 : 0

  const catGoals = Object.entries(goals).filter(([k]) => k !== '__overall__')
  let budgetScore = 0
  if (catGoals.length > 0) {
    const monthSpend = {}
    transactions.forEach((t) => {
      if (!t.date) return
      const d = new Date(t.date + 'T00:00:00')
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        && String(t.type || '').toUpperCase() === 'EXPENSE') {
        monthSpend[t.category] = (monthSpend[t.category] || 0) + (parseFloat(t.amount) || 0)
      }
    })
    const withinBudget = catGoals.filter(([cat, limit]) => (monthSpend[cat] || 0) <= limit).length
    budgetScore = Math.round((withinBudget / catGoals.length) * 35)
  } else {
    budgetScore = 10
  }

  const overallLimit = goals['__overall__'] || 0
  const limitScore = overallLimit > 0 ? (mExpense <= overallLimit ? 15 : mExpense <= overallLimit * 1.1 ? 8 : 0) : 10

  const hasThisMonth = mIncome > 0 || mExpense > 0
  const hasLastMonth = lmIncome > 0 || lmExpense > 0
  const consistencyScore = hasThisMonth && hasLastMonth ? 15 : hasThisMonth ? 8 : 0

  const score = Math.min(100, savingsScore + budgetScore + limitScore + consistencyScore)
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F'
  const gradeColor = score >= 80 ? '#38ef7d' : score >= 65 ? '#00c6ff' : score >= 50 ? '#ffd200' : score >= 35 ? '#f7971e' : '#ff6b6b'
  const gradeLabel = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : score >= 35 ? 'Needs Work' : 'Critical'
  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference - (score / 100) * circumference

  const breakdown = [
    { label: 'Savings Rate', score: savingsScore, max: 35, tip: savingsRate >= 0.2 ? 'Great! 20%+ saved' : `Save ${Math.max(0, Math.round((0.2 - savingsRate) * 100))}% more to max` },
    { label: 'Budget Adherence', score: budgetScore, max: 35, tip: catGoals.length > 0 ? `${catGoals.filter(([c, l]) => {
      const ms = {}; transactions.forEach(t => { if (!t.date) return; const d = new Date(t.date+'T00:00:00'); if(d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&String(t.type||'').toUpperCase()==='EXPENSE') ms[t.category]=(ms[t.category]||0)+(parseFloat(t.amount)||0) }); return (ms[c]||0)<=l
    }).length}/${catGoals.length} categories within budget` : 'Set budget goals to improve' },
    { label: 'Monthly Limit', score: limitScore, max: 15, tip: overallLimit > 0 ? (mExpense <= overallLimit ? 'Within overall limit ✓' : 'Over monthly limit') : 'Set an overall limit to improve' },
    { label: 'Consistency', score: consistencyScore, max: 15, tip: hasThisMonth && hasLastMonth ? 'Tracking both months ✓' : 'Track transactions every month' },
  ]

  return (
    <motion.div className="chart-card chart-wide fhs-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <h3 className="chart-title">🏆 Financial Health Score</h3>
      <div className="fhs-body">
        <div className="fhs-ring-section">
          <div className="fhs-ring-wrap">
            <svg width={130} height={130} viewBox="0 0 110 110">
              <circle cx={55} cy={55} r={44} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
              <circle cx={55} cy={55} r={44} fill="none" stroke={gradeColor} strokeWidth={10}
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                transform="rotate(-90 55 55)" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
            </svg>
            <div className="fhs-ring-center">
              <span className="fhs-score" style={{ color: gradeColor }}>{score}</span>
              <span className="fhs-score-lbl">/ 100</span>
            </div>
          </div>
          <div className="fhs-grade-badge" style={{ background: `${gradeColor}22`, border: `1px solid ${gradeColor}55` }}>
            <span className="fhs-grade" style={{ color: gradeColor }}>{grade}</span>
            <span className="fhs-grade-label" style={{ color: gradeColor }}>{gradeLabel}</span>
          </div>
        </div>
        <div className="fhs-breakdown">
          {breakdown.map((item) => (
            <div key={item.label} className="fhs-item">
              <div className="fhs-item-top">
                <span className="fhs-item-label">{item.label}</span>
                <span className="fhs-item-score">{item.score}<span className="fhs-item-max">/{item.max}</span></span>
              </div>
              <div className="fhs-item-bar-track">
                <motion.div className="fhs-item-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((item.score / item.max) * 100)}%` }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  style={{ background: item.score === item.max ? '#38ef7d' : item.score >= item.max * 0.6 ? '#ffd200' : '#ff6b6b' }}
                />
              </div>
              <span className="fhs-item-tip">{item.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
