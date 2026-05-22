import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import AdminLoginPage from './pages/AdminLoginPage'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProfilePage from './pages/ProfilePage'
import AdminProfilePage from './pages/AdminProfilePage'
import TransactionsPage from './pages/TransactionsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import BudgetGoalsPage from './pages/BudgetGoalsPage'
import SavingsGoalsPage from './pages/SavingsGoalsPage'
import RecurringPage from './pages/RecurringPage'
import EmiTrackerPage from './pages/EmiTrackerPage'

// Both regular users and admins can access personal finance routes
const AppRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>{children}</ProtectedRoute>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route path="/dashboard"    element={<AppRoute><Dashboard /></AppRoute>} />
          <Route path="/transactions" element={<AppRoute><TransactionsPage /></AppRoute>} />
          <Route path="/analytics"    element={<AppRoute><AnalyticsPage /></AppRoute>} />
          <Route path="/budget"       element={<AppRoute><BudgetGoalsPage /></AppRoute>} />
          <Route path="/savings"      element={<AppRoute><SavingsGoalsPage /></AppRoute>} />
          <Route path="/recurring"    element={<AppRoute><RecurringPage /></AppRoute>} />
          <Route path="/emi"          element={<AppRoute><EmiTrackerPage /></AppRoute>} />
          <Route path="/profile"      element={<AppRoute><ProfilePage /></AppRoute>} />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['ADMIN']}><AdminProfilePage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
