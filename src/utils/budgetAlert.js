import API from '../api/axiosConfig'
import toast from 'react-hot-toast'

/**
 * After adding an EXPENSE transaction, check if it pushes a category to or
 * over its monthly budget limit and show a warning toast if so.
 *
 * @param {object} formData          - The transaction that was just saved
 * @param {Array}  existingTransactions - The transaction list BEFORE the new one was added
 */
export async function checkBudgetAlert(formData, existingTransactions) {
  if (formData.type !== 'EXPENSE') return

  const now = new Date()
  const txDate = new Date(formData.date + 'T00:00:00')
  const isCurrentMonth =
    txDate.getMonth() === now.getMonth() &&
    txDate.getFullYear() === now.getFullYear()
  if (!isCurrentMonth) return

  let goals
  try {
    const res = await API.get('/budget/goals')
    goals = res.data || {}
  } catch {
    return
  }

  const goal = goals[formData.category]
  if (!goal) return

  const oldSpend = existingTransactions
    .filter((t) => {
      if (String(t.type).toUpperCase() !== 'EXPENSE') return false
      if (t.category !== formData.category) return false
      const d = new Date(t.date + 'T00:00:00')
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
    })
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

  const newSpend = oldSpend + parseFloat(formData.amount)

  // Only alert when crossing the threshold (under → at/over)
  if (oldSpend >= goal) return

  if (newSpend >= goal) {
    const over = newSpend - goal
    const limitStr = `₹${goal.toLocaleString('en-IN')}`
    const overStr = `₹${over.toLocaleString('en-IN')}`

    if (over === 0) {
      toast(`You've hit your ${formData.category} budget limit of ${limitStr}!`, {
        icon: '⚠️',
        style: {
          background: '#2a1a00',
          color: '#ffd200',
          border: '1px solid #ffd200',
          fontWeight: 600,
        },
        duration: 6000,
      })
    } else {
      toast.error(
        `${formData.category} is ${overStr} over your ${limitStr} budget!`,
        { duration: 6000 }
      )
    }
  }
}
