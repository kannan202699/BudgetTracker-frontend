import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { motion } from 'framer-motion'

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
