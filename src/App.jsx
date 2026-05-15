import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminLoginPage from './pages/AdminLoginPage'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProfilePage from './pages/ProfilePage'
import AdminProfilePage from './pages/AdminProfilePage'
import TransactionsPage from './pages/TransactionsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import BudgetGoalsPage from './pages/BudgetGoalsPage'

const UserRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['USER']}>{children}</ProtectedRoute>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
          <Route path="/transactions" element={<UserRoute><TransactionsPage /></UserRoute>} />
          <Route path="/analytics" element={<UserRoute><AnalyticsPage /></UserRoute>} />
          <Route path="/budget" element={<UserRoute><BudgetGoalsPage /></UserRoute>} />
          <Route path="/profile" element={<UserRoute><ProfilePage /></UserRoute>} />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminProfilePage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
