import { motion } from 'framer-motion'
import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi'
import { MdCurrencyRupee } from 'react-icons/md'

const cardConfig = [
  {
    key: 'balance',
    label: 'Total Balance',
    icon: MdCurrencyRupee,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shadowColor: 'rgba(102, 126, 234, 0.4)',
    prefix: '₹',
  },
  {
    key: 'income',
    label: 'Total Income',
    icon: FiTrendingUp,
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    shadowColor: 'rgba(17, 153, 142, 0.4)',
    prefix: '₹',
  },
  {
    key: 'expense',
    label: 'Total Expenses',
    icon: FiTrendingDown,
    gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
    shadowColor: 'rgba(235, 51, 73, 0.4)',
    prefix: '₹',
  },
  {
    key: 'count',
    label: 'Transactions',
    icon: FiActivity,
    gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    shadowColor: 'rgba(247, 151, 30, 0.4)',
    prefix: '',
  },
]

function formatNumber(num) {
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(2)}L`
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(2)}K`
  return num?.toLocaleString('en-IN') ?? '0'
}

export default function SummaryCards({ transactions = [] }) {
  let income = 0
  let expense = 0

  for (const t of transactions) {
    const amt = parseFloat(t.amount) || 0
    const type = String(t.type || '').toUpperCase().trim()
    if (type === 'INCOME') income += amt
    else if (type === 'EXPENSE') expense += amt
  }

  const balance = income - expense
  const count = transactions.length

  const values = { balance, income, expense, count }

  return (
    <div className="summary-cards-grid">
      {cardConfig.map((card, i) => {
        const Icon = card.icon
        const value = values[card.key]
        const isNegative = card.key === 'balance' && value < 0

        return (
          <motion.div
            key={card.key}
            className="summary-card"
            style={{ background: isNegative && card.key === 'balance'
              ? 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'
              : card.gradient,
              boxShadow: `0 8px 32px ${card.shadowColor}`
            }}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ y: -6, scale: 1.03, boxShadow: `0 16px 40px ${card.shadowColor}` }}
          >
            <div className="card-content">
              <div className="card-top">
                <p className="card-label">{card.label}</p>
                <div className="card-icon-wrap">
                  <Icon size={22} />
                </div>
              </div>
              <motion.p
                className="card-value"
                key={value}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {card.prefix}{formatNumber(value)}
              </motion.p>
              <div className="card-footer">
                <span className="card-change">
                  {card.key === 'balance'
                    ? `${value >= 0 ? '↑ Positive' : '↓ Negative'} balance`
                    : card.key === 'count'
                    ? `${count} total records`
                    : `From ${transactions.filter((t) => t.type === (card.key === 'income' ? 'INCOME' : 'EXPENSE')).length} entries`}
                </span>
              </div>
            </div>
            {/* Decorative circle */}
            <div className="card-deco-circle" />
            <div className="card-deco-circle-2" />
          </motion.div>
        )
      })}
    </div>
  )
}
