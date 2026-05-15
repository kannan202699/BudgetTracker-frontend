import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token        = localStorage.getItem('token')
    const role         = localStorage.getItem('role')
    const username     = localStorage.getItem('username')
    const userId       = localStorage.getItem('userId')
    const refreshToken = localStorage.getItem('refreshToken')
    if (token && role && username) {
      setUser({ token, role, username, userId, refreshToken })
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    localStorage.setItem('token',        data.token)
    localStorage.setItem('role',         data.role)
    localStorage.setItem('username',     data.username)
    localStorage.setItem('refreshToken', data.refreshToken || '')
    if (data.userId) localStorage.setItem('userId', data.userId)
    setUser({
      token:        data.token,
      role:         data.role,
      username:     data.username,
      userId:       data.userId,
      refreshToken: data.refreshToken,
    })
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    // Best-effort: tell the server to revoke the refresh token
    if (refreshToken) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/logout`,
          { refreshToken },
          { timeout: 5000 }
        )
      } catch {
        // Ignore — local state is cleared regardless
      }
    }
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
