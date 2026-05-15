// Shared validation utilities — used across Login, Register, Profile, TransactionForm

export function validateUsername(value) {
  const val = (value || '').trim()
  if (!val) return 'Username is required'
  if (val.length < 3) return 'Must be at least 3 characters'
  if (val.length > 30) return 'Must be 30 characters or less'
  if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Only letters, numbers, and underscores allowed'
  return null
}

export function validatePassword(value, strict = false) {
  const val = value || ''
  if (!val) return 'Password is required'
  if (strict) {
    if (val.length < 8) return 'At least 8 characters required'
    if (!/[A-Z]/.test(val)) return 'Must include an uppercase letter'
    if (!/[a-z]/.test(val)) return 'Must include a lowercase letter'
    if (!/\d/.test(val)) return 'Must include a number'
    if (!/[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'/]/.test(val)) return 'Must include a special character'
  }
  return null
}

export function getPasswordStrength(value) {
  if (!value) return { score: 0, label: '', color: '#444' }
  let score = 0
  if (value.length >= 8) score++
  if (/[A-Z]/.test(value)) score++
  if (/[a-z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'/]/.test(value)) score++
  const levels = [
    { label: '', color: '#444' },
    { label: 'Very Weak', color: '#ff4444' },
    { label: 'Weak', color: '#ff8800' },
    { label: 'Fair', color: '#ffd200' },
    { label: 'Good', color: '#38ef7d' },
    { label: 'Strong', color: '#00c853' },
  ]
  return { score, ...levels[score] }
}

export function getPasswordChecks(value) {
  const v = value || ''
  return {
    length:  v.length >= 8,
    upper:   /[A-Z]/.test(v),
    lower:   /[a-z]/.test(v),
    digit:   /\d/.test(v),
    special: /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'/]/.test(v),
  }
}

export function validateEmail(value) {
  const val = (value || '').trim()
  if (!val) return null // optional field
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Invalid email address'
  if (val.length > 100) return 'Must not exceed 100 characters'
  return null
}

export function validatePhone(value) {
  const val = (value || '').trim()
  if (!val) return null // optional field
  if (!/^\+?[\d\s\-()/]{7,20}$/.test(val)) return 'Invalid phone number (7-20 digits)'
  return null
}

export function validateFullName(value) {
  const val = (value || '').trim()
  if (!val) return null // optional field
  if (val.length < 2) return 'Must be at least 2 characters'
  if (val.length > 60) return 'Must not exceed 60 characters'
  if (!/^[a-zA-Z\s'\-]+$/.test(val)) return "Only letters, spaces, hyphens, and apostrophes allowed"
  return null
}

export function validateAmount(value) {
  const val = String(value || '').trim()
  if (!val) return 'Amount is required'
  const num = parseFloat(val)
  if (isNaN(num)) return 'Enter a valid number'
  if (num <= 0) return 'Amount must be greater than 0'
  if (num > 99999999) return 'Amount is too large (max ₹9,99,99,999)'
  return null
}
