import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
})

// ── Request: attach access token ─────────────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Token-refresh state ───────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue = []   // requests waiting for the new token

const processQueue = (error, newToken = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(newToken)))
  failedQueue = []
}

// ── Response: silently refresh on 401 ────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      const accessToken   = localStorage.getItem('token')
      const refreshToken  = localStorage.getItem('refreshToken')

      // Not logged in at all — just surface the error (e.g. wrong login credentials)
      if (!accessToken || !refreshToken) {
        return Promise.reject(error)
      }

      // Another refresh is already in-flight — queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`
          return API(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        // Use a plain axios call — NOT the API instance — to avoid interceptor loop
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 10000 }
        )

        const { token: newToken, refreshToken: newRefreshToken } = res.data
        localStorage.setItem('token', newToken)
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)

        API.defaults.headers.common.Authorization = `Bearer ${newToken}`
        original.headers.Authorization = `Bearer ${newToken}`

        processQueue(null, newToken)
        return API(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Refresh token itself is expired / invalid → force logout
        const role = localStorage.getItem('role')
        localStorage.clear()
        window.location.href = role === 'ADMIN' ? '/admin/login' : '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Non-401 errors: improve network/timeout messages
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check your connection.'
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.'
    }

    return Promise.reject(error)
  }
)

export default API
