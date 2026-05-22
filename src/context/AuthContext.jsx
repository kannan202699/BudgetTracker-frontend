import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

function parseTokenExpiry(token) {
  try {
    return JSON.parse(atob(token.split('.')[1])).exp * 1000
  } catch {
    return null
  }
}

async function doRefresh() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 10000 }
    )
    const { token, refreshToken: newRT } = res.data
    localStorage.setItem('token', token)
    if (newRT) localStorage.setItem('refreshToken', newRT)
    return token
  } catch (err) {
    // Only clear session if the server explicitly rejects the refresh token
    const status = err?.response?.status
    if (status === 401 || status === 403) {
      localStorage.clear()
      const role = localStorage.getItem('role')
      window.location.href = role === 'ADMIN' ? '/admin/login' : '/login'
    }
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (token) => {
    if (!token) return
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      })
      setUser((prev) => (prev ? { ...prev, ...res.data } : prev))
    } catch {
      // profile fetch is best-effort; base user state still works
    }
  }, [])

  useEffect(() => {
    const token        = localStorage.getItem('token')
    const role         = localStorage.getItem('role')
    const username     = localStorage.getItem('username')
    const userId       = localStorage.getItem('userId')
    const refreshToken = localStorage.getItem('refreshToken')
    if (token && role && username) {
      setUser({ token, role, username, userId, refreshToken })
      fetchProfile(token)
    }
    setLoading(false)
  }, [fetchProfile])

  // Proactively refresh access token when user returns to the tab
  // and the token is within 15 minutes of expiry
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return
      const token = localStorage.getItem('token')
      if (!token) return
      const expiry = parseTokenExpiry(token)
      if (!expiry) return
      const msLeft = expiry - Date.now()
      if (msLeft < 15 * 60 * 1000) { // less than 15 min left
        const newToken = await doRefresh()
        if (newToken) {
          fetchProfile(newToken)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchProfile])

  const login = (data, remember = true) => {
    localStorage.setItem('token',    data.token)
    localStorage.setItem('role',     data.role)
    localStorage.setItem('username', data.username)
    if (data.userId) localStorage.setItem('userId', data.userId)
    // Only persist refresh token when "remember me" is enabled
    if (remember && data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    } else {
      localStorage.removeItem('refreshToken')
    }
    const baseUser = {
      token:        data.token,
      role:         data.role,
      username:     data.username,
      userId:       data.userId,
      refreshToken: remember ? data.refreshToken : null,
    }
    setUser(baseUser)
    fetchProfile(data.token)
  }

  const refreshProfile = () => {
    const token = localStorage.getItem('token')
    fetchProfile(token)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/logout`,
          { refreshToken },
          { timeout: 5000 }
        )
      } catch {
        // Ignore
      }
    }
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
