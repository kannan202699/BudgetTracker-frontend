import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import { IncomeExpenseBarChart, CategoryPieChart } from '../components/Charts'
import API from '../api/axiosConfig'

export default function AnalyticsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/transactions/all')
      .then((res) => setTransactions(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const expenses = transactions.filter((t) => String(t.type || '').toUpperCase() === 'EXPENSE')
  const catMap = {}
  expenses.forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + (parseFloat(t.amount) || 0)
  })
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const totalExpense = expenses.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)

  const totalIncome = transactions
    .filter((t) => String(t.type || '').toUpperCase() === 'INCOME')
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className={`main-content ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Deep insights into your financial patterns</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton-table" style={{ height: 400 }} />
        ) : (
          <>
            {/* Key stat chips */}
            <div className="analytics-chips">
              <div className="analytics-chip">
                <span className="chip-icon">📊</span>
                <div>
                  <p className="chip-label">Total Transactions</p>
                  <p className="chip-val">{transactions.length}</p>
                </div>
              </div>
              <div className="analytics-chip">
                <span className="chip-icon">💚</span>
                <div>
                  <p className="chip-label">Overall Savings Rate</p>
                  <p className="chip-val" style={{ color: savingsRate >= 20 ? '#38ef7d' : savingsRate > 0 ? '#ffd200' : '#ff6b6b' }}>
                    {savingsRate}%
                  </p>
                </div>
              </div>
              <div className="analytics-chip">
                <span className="chip-icon">💸</span>
                <div>
                  <p className="chip-label">Total Outflow</p>
                  <p className="chip-val expense-color">₹{totalExpense.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="analytics-chip">
                <span className="chip-icon">💰</span>
                <div>
                  <p className="chip-label">Total Inflow</p>
                  <p className="chip-val income-color">₹{totalIncome.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <IncomeExpenseBarChart transactions={transactions} />
              <CategoryPieChart transactions={transactions} />
            </div>

            <div className="analytics-section">
              <h3 className="analytics-title">Top Spending Categories</h3>
              <div className="category-breakdown">
                {topCats.map(([cat, amt], i) => {
                  const pct = totalExpense ? Math.round((amt / totalExpense) * 100) : 0
                  return (
                    <div key={cat} className="cat-row">
                      <div className="cat-info">
                        <span className="cat-rank">#{i + 1}</span>
                        <span className="cat-name">{cat}</span>
                      </div>
                      <div className="cat-bar-wrap">
                        <motion.div className="cat-bar" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          style={{ background: `hsl(${i * 60}, 70%, 55%)` }} />
                      </div>
                      <span className="cat-pct">{pct}%</span>
                      <span className="cat-amt">₹{amt.toLocaleString('en-IN')}</span>
                    </div>
                  )
                })}
                {topCats.length === 0 && <p className="no-data">No expense data available</p>}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
