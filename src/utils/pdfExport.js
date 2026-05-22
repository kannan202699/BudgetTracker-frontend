import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function fmt(val) {
  const v = Math.abs(val)
  if (v >= 100000) return `Rs ${(v / 100000).toFixed(2)}L`
  if (v >= 1000) return `Rs ${(v / 1000).toFixed(2)}K`
  return `Rs ${v.toLocaleString('en-IN')}`
}

function fmtFull(val) {
  return `Rs ${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function drawHeader(doc, W, title, subtitle, user) {
  const hasContact = user?.email || user?.phone
  const headerH = hasContact ? 40 : 34

  doc.setFillColor(22, 22, 42)
  doc.rect(0, 0, W, headerH, 'F')

  // Profile picture (if available)
  let logoX = 14
  if (user?.profilePicture) {
    try {
      const fmt = user.profilePicture.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      doc.addImage(user.profilePicture, fmt, 14, 3, 14, 14)
      logoX = 30
    } catch { /* skip if image fails */ }
  }

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('BudgetPro', logoX, 13)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 220)
  doc.text(title, logoX, 22)

  // Right side — user info
  const name = user?.fullName || user?.username || 'N/A'
  const uid  = user?.id ? `#${user.id}` : ''
  const role = user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : ''
  doc.setTextColor(160, 160, 210)
  doc.text(`${name}  ${uid}  ·  ${role}`, W - 14, 11, { align: 'right' })
  doc.setTextColor(120, 120, 165)
  doc.text(`@${user?.username || ''}  ·  Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, W - 14, 19, { align: 'right' })

  if (hasContact) {
    const contactParts = [user?.email, user?.phone].filter(Boolean)
    doc.setFontSize(8.5)
    doc.setTextColor(100, 100, 150)
    doc.text(contactParts.join('  ·  '), W - 14, 27, { align: 'right' })
  }

  // Subtitle strip
  doc.setFillColor(102, 126, 234)
  doc.rect(0, headerH, W, 6, 'F')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(subtitle.toUpperCase(), W / 2, headerH + 4.5, { align: 'center' })

  return headerH + 10 // startY for summary boxes
}

function drawSummaryBoxes(doc, W, boxes, startY) {
  const boxW = (W - 28 - (boxes.length - 1) * 4) / boxes.length
  boxes.forEach((b, i) => {
    const x = 14 + i * (boxW + 4)
    doc.setFillColor(245, 245, 255)
    doc.roundedRect(x, startY, boxW, 22, 3, 3, 'F')
    doc.setFillColor(...b.accent)
    doc.roundedRect(x, startY, 3, 22, 1.5, 1.5, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(110, 110, 140)
    doc.text(b.label, x + boxW / 2, startY + 7, { align: 'center' })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...b.color)
    doc.text(b.val, x + boxW / 2, startY + 16, { align: 'center' })
  })
  return startY + 26
}

function drawSectionTitle(doc, text, y) {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 65)
  doc.text(text, 14, y)
  doc.setDrawColor(200, 200, 230)
  doc.setLineWidth(0.4)
  doc.line(14, y + 2, 196, y + 2)
  return y + 7
}

function drawFooter(doc, label) {
  const pages = doc.getNumberOfPages()
  const H = doc.internal.pageSize.getHeight()
  const W = doc.internal.pageSize.getWidth()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(240, 240, 248)
    doc.rect(0, H - 12, W, 12, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(130, 130, 165)
    doc.text(`BudgetPro  ·  ${label}  ·  Confidential`, 14, H - 5)
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 5, { align: 'right' })
  }
}

function safeY(doc, needed = 30) {
  const H = doc.internal.pageSize.getHeight()
  const current = doc.lastAutoTable?.finalY ?? doc.internal.getCurrentPageInfo().pageContext?.y ?? 60
  if (current + needed > H - 16) { doc.addPage(); return 14 }
  return current + 8
}

// ─── MONTHLY REPORT ────────────────────────────────────────────────────────

export function exportReport({ type, month, year, transactions = [], user = {}, emiLoans = [], savingsGoals = [], recurringTransactions = [], includes = {} }) {
  const inc = {
    transactions: true, categoryBreakdown: true, monthlySummary: true,
    savingsGoals: true, emiLoans: true, recurringTransactions: true,
    ...includes,
  }
  if (type === 'yearly') {
    return buildYearlyReport({ year, transactions, user, emiLoans, savingsGoals, recurringTransactions, inc })
  }
  return buildMonthlyReport({ month, year, transactions, user, emiLoans, savingsGoals, recurringTransactions, inc })
}

function buildMonthlyReport({ month, year, transactions, user, emiLoans, savingsGoals, recurringTransactions, inc }) {
  const periodLabel = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const filtered = transactions.filter((t) => {
    if (!t.date) return false
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() === month - 1 && d.getFullYear() === year
  })

  let income = 0, expense = 0
  const catMap = {}
  filtered.forEach((t) => {
    const amt = parseFloat(t.amount) || 0
    if (String(t.type).toUpperCase() === 'INCOME') income += amt
    else { expense += amt; catMap[t.category] = (catMap[t.category] || 0) + amt }
  })
  const net = income - expense
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  const startY = drawHeader(doc, W, `Monthly Report — ${periodLabel}`, `Financial Report · ${periodLabel}`, user)

  let y = drawSummaryBoxes(doc, W, [
    { label: 'Total Income',   val: fmt(income),  color: [17, 153, 142],   accent: [17, 153, 142] },
    { label: 'Total Expenses', val: fmt(expense), color: [235, 51, 73],    accent: [235, 51, 73] },
    { label: 'Net Savings',    val: (net >= 0 ? '+' : '-') + fmt(net), color: net >= 0 ? [17, 153, 142] : [235, 51, 73], accent: net >= 0 ? [56, 239, 125] : [235, 51, 73] },
    { label: 'Savings Rate',   val: `${savingsRate}%`, color: savingsRate >= 20 ? [17, 153, 142] : savingsRate > 0 ? [180, 140, 0] : [235, 51, 73], accent: [102, 126, 234] },
  ], startY)

  if (inc.categoryBreakdown) {
    const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 10)
    if (topCats.length > 0) {
      y = drawSectionTitle(doc, 'Expense by Category', y)
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Amount (Rs)', '% of Expenses']],
        body: topCats.map(([cat, amt]) => [cat, fmtFull(amt), expense > 0 ? `${Math.round((amt / expense) * 100)}%` : '0%']),
        ...tableStyle(),
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      })
    }
  }

  if (inc.transactions) {
    y = safeY(doc, 20)
    y = drawSectionTitle(doc, `Transactions (${filtered.length})`, y)
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Category', 'Description', 'Amount (Rs)']],
      body: [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => [
        new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        t.type, t.category || '—', t.description || '—',
        String(t.type).toUpperCase() === 'INCOME' ? `+${fmtFull(t.amount)}` : `-${fmtFull(t.amount)}`,
      ]),
      ...tableStyle(),
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = data.cell.raw?.startsWith('+') ? [17, 153, 142] : [235, 51, 73]
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = data.cell.raw === 'INCOME' ? [17, 153, 142] : [235, 51, 73]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      columnStyles: { 4: { halign: 'right' } },
    })
  }

  appendSharedSections(doc, { savingsGoals, emiLoans, recurringTransactions, inc })
  drawFooter(doc, `Monthly Report · ${periodLabel} · @${user?.username || ''}`)
  doc.save(`BudgetPro_Monthly_${periodLabel.replace(' ', '_')}_${user?.username || 'report'}.pdf`)
}

// ─── YEARLY REPORT ─────────────────────────────────────────────────────────

function buildYearlyReport({ year, transactions, user, emiLoans, savingsGoals, recurringTransactions, inc }) {
  const filtered = transactions.filter((t) => {
    if (!t.date) return false
    return new Date(t.date + 'T00:00:00').getFullYear() === year
  })

  let totalIncome = 0, totalExpense = 0
  const catMap = {}
  filtered.forEach((t) => {
    const amt = parseFloat(t.amount) || 0
    if (String(t.type).toUpperCase() === 'INCOME') totalIncome += amt
    else { totalExpense += amt; catMap[t.category] = (catMap[t.category] || 0) + amt }
  })
  const totalNet = totalIncome - totalExpense
  const totalSavingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

  // Build monthly breakdown
  const monthMap = {}
  for (let m = 0; m < 12; m++) {
    const key = m
    monthMap[key] = { label: new Date(year, m, 1).toLocaleString('en-IN', { month: 'long' }), income: 0, expense: 0 }
  }
  filtered.forEach((t) => {
    const m = new Date(t.date + 'T00:00:00').getMonth()
    const amt = parseFloat(t.amount) || 0
    if (String(t.type).toUpperCase() === 'INCOME') monthMap[m].income += amt
    else monthMap[m].expense += amt
  })
  const monthlyRows = Object.values(monthMap).filter((r) => r.income > 0 || r.expense > 0)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  const startY = drawHeader(doc, W, `Annual Report — ${year}`, `Annual Financial Report · ${year}`, user)

  let y = drawSummaryBoxes(doc, W, [
    { label: 'Total Income',   val: fmt(totalIncome),  color: [17, 153, 142],  accent: [17, 153, 142] },
    { label: 'Total Expenses', val: fmt(totalExpense), color: [235, 51, 73],   accent: [235, 51, 73] },
    { label: 'Net Savings',    val: (totalNet >= 0 ? '+' : '-') + fmt(totalNet), color: totalNet >= 0 ? [17, 153, 142] : [235, 51, 73], accent: totalNet >= 0 ? [56, 239, 125] : [235, 51, 73] },
    { label: 'Savings Rate',   val: `${totalSavingsRate}%`, color: totalSavingsRate >= 20 ? [17, 153, 142] : totalSavingsRate > 0 ? [180, 140, 0] : [235, 51, 73], accent: [102, 126, 234] },
  ], startY)

  // Monthly breakdown
  if (inc.monthlySummary && monthlyRows.length > 0) {
    y = drawSectionTitle(doc, 'Monthly Breakdown', y)
    autoTable(doc, {
      startY: y,
      head: [['Month', 'Income (Rs)', 'Expenses (Rs)', 'Net (Rs)', 'Savings Rate']],
      body: monthlyRows.map((r) => {
        const net = r.income - r.expense
        const rate = r.income > 0 ? Math.round(((r.income - r.expense) / r.income) * 100) : 0
        return [r.label, fmtFull(r.income), fmtFull(r.expense), (net >= 0 ? '+' : '-') + fmtFull(net), `${rate}%`]
      }),
      ...tableStyle(),
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = data.cell.raw?.startsWith('+') ? [17, 153, 142] : [235, 51, 73]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    })
  }

  // Category breakdown
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 10)
  if (inc.categoryBreakdown && topCats.length > 0) {
    y = safeY(doc, 20)
    y = drawSectionTitle(doc, 'Expense by Category', y)
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount (Rs)', '% of Expenses']],
      body: topCats.map(([cat, amt]) => [cat, fmtFull(amt), totalExpense > 0 ? `${Math.round((amt / totalExpense) * 100)}%` : '0%']),
      ...tableStyle(),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    })
  }

  // Full transactions
  if (inc.transactions) {
    y = safeY(doc, 20)
    y = drawSectionTitle(doc, `All Transactions (${filtered.length})`, y)
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Category', 'Description', 'Amount (Rs)']],
      body: [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => [
        new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        t.type, t.category || '—', t.description || '—',
        String(t.type).toUpperCase() === 'INCOME' ? `+${fmtFull(t.amount)}` : `-${fmtFull(t.amount)}`,
      ]),
      ...tableStyle(),
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = data.cell.raw?.startsWith('+') ? [17, 153, 142] : [235, 51, 73]
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = data.cell.raw === 'INCOME' ? [17, 153, 142] : [235, 51, 73]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      columnStyles: { 4: { halign: 'right' } },
    })
  }

  appendSharedSections(doc, { savingsGoals, emiLoans, recurringTransactions, inc })
  drawFooter(doc, `Annual Report · ${year} · @${user?.username || ''}`)
  doc.save(`BudgetPro_Annual_${year}_${user?.username || 'report'}.pdf`)
}

// ─── SHARED SECTIONS (Savings Goals / EMI / Recurring) ─────────────────────

function appendSharedSections(doc, { savingsGoals, emiLoans, recurringTransactions, inc = {} }) {
  // Savings Goals
  if (inc.savingsGoals && savingsGoals?.length > 0) {
    let y = safeY(doc, 20)
    y = drawSectionTitle(doc, 'Savings Goals', y)
    autoTable(doc, {
      startY: y,
      head: [['Goal', 'Target (Rs)', 'Saved (Rs)', 'Progress', 'Deadline']],
      body: savingsGoals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) : 0
        const deadline = g.deadline
          ? new Date(g.deadline + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'No deadline'
        return [g.title, fmtFull(g.targetAmount), fmtFull(g.savedAmount), `${pct}%`, deadline]
      }),
      ...tableStyle(),
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const pct = parseInt(data.cell.raw)
          data.cell.styles.textColor = pct >= 100 ? [17, 153, 142] : pct >= 50 ? [180, 140, 0] : [150, 150, 180]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    })
  }

  // EMI Loans
  if (inc.emiLoans && emiLoans?.length > 0) {
    let y = safeY(doc, 20)
    y = drawSectionTitle(doc, 'EMI Loans', y)
    autoTable(doc, {
      startY: y,
      head: [['Loan', 'Principal (Rs)', 'EMI/Month (Rs)', 'Outstanding (Rs)', 'Months Left', 'Next Due']],
      body: emiLoans.map((l) => [
        l.loanName,
        fmtFull(l.principal),
        fmtFull(l.emiAmount),
        fmtFull(l.remainingBalance),
        l.monthsRemaining > 0 ? String(l.monthsRemaining) : 'Completed',
        l.nextDueDate
          ? new Date(l.nextDueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—',
      ]),
      ...tableStyle(),
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = [235, 51, 73]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' }, 5: { halign: 'center' } },
    })
  }

  // Recurring Transactions
  const activeRecurring = recurringTransactions?.filter((r) => r.active) || []
  if (inc.recurringTransactions && activeRecurring.length > 0) {
    let y = safeY(doc, 20)
    y = drawSectionTitle(doc, 'Active Recurring Transactions', y)
    autoTable(doc, {
      startY: y,
      head: [['Type', 'Category', 'Amount (Rs)', 'Description', 'Frequency', 'Day']],
      body: activeRecurring.map((r) => [
        r.type,
        r.category,
        fmtFull(r.amount),
        r.description || '—',
        r.frequency,
        String(r.dayOfMonth),
      ]),
      ...tableStyle(),
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 0) {
          data.cell.styles.textColor = data.cell.raw === 'INCOME' ? [17, 153, 142] : [235, 51, 73]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      columnStyles: { 2: { halign: 'right' }, 5: { halign: 'center' } },
    })
  }
}

// ─── SHARED TABLE STYLE ─────────────────────────────────────────────────────

function tableStyle() {
  return {
    headStyles: { fillColor: [22, 22, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
    bodyStyles: { fontSize: 8.5, textColor: [40, 40, 70], cellPadding: 3.5 },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    margin: { left: 14, right: 14 },
  }
}
