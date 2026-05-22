import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiLock } from 'react-icons/fi'

const sections = [
  {
    title: '1. Information We Collect',
    body: `When you register, we collect your email address, username, and optionally your phone number and full name. As you use the app, we store the financial data you enter — including transactions, budget goals, savings goals, EMI details, and recurring items. We do not collect payment card numbers, bank login credentials, or any sensitive banking information.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your personal information is used solely to operate and improve the BudgetPro service. Specifically, we use your email to authenticate your account and send important service notifications such as password reset links. Your financial data is used to display analytics, summaries, and reports within the app. We do not sell, rent, or share your personal data with third-party advertisers.`,
  },
  {
    title: '3. Data Storage & Security',
    body: `All data is stored in a secure database with access controls. Passwords are hashed using BCrypt and are never stored in plain text. Authentication uses short-lived JWT tokens (8 hours) with optional refresh tokens (7 days) for persistent sessions. All API communication is encrypted in transit via HTTPS in production.`,
  },
  {
    title: '4. Email Communications',
    body: `We send transactional emails only — specifically password reset links when requested. We do not send marketing emails or newsletters. You will only receive an email from BudgetPro when you explicitly trigger an action (such as "Forgot Password") or when there is a critical account security event.`,
  },
  {
    title: '5. Data Retention',
    body: `Your data is retained for as long as your account is active. If you delete your account, all associated data — including transactions, goals, and profile information — is permanently removed from our systems within 30 days. Password reset tokens are automatically deleted after 15 minutes whether used or not.`,
  },
  {
    title: '6. Cookies & Local Storage',
    body: `BudgetPro uses browser localStorage to store your authentication session (JWT token, username, role). No third-party tracking cookies are used. If you choose "Remember me" during login, a refresh token is additionally stored to keep your session active for up to 7 days. Logging out clears all stored session data.`,
  },
  {
    title: '7. Your Rights',
    body: `You have the right to access the data we hold about you, to correct inaccurate information, and to request deletion of your account and all associated data. You can update your profile information (email, phone, full name, avatar) at any time from the Profile page within the app.`,
  },
  {
    title: '8. Third-Party Services',
    body: `BudgetPro may be hosted on third-party infrastructure (such as cloud hosting providers). These providers have their own privacy policies and security practices. We do not integrate with third-party analytics, advertising, or social media tracking services.`,
  },
  {
    title: '9. Children\'s Privacy',
    body: `BudgetPro is not intended for use by children under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child has provided us personal data without parental consent, we will delete that information promptly.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. Significant changes will be communicated via the email address associated with your account. Continued use of BudgetPro after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '11. Contact',
    body: `If you have questions or concerns about how we handle your data, or to exercise your data rights, please contact us through the in-app support or via our official email address listed on the platform.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        {/* Header */}
        <div className="policy-header">
          <div className="policy-icon" style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)' }}>
            <FiLock size={24} />
          </div>
          <div>
            <h1 className="policy-title">Privacy Policy</h1>
            <p className="policy-meta">BudgetPro · Last updated May 2025</p>
          </div>
        </div>

        <p className="policy-intro">
          Your privacy matters. This policy explains exactly what data BudgetPro collects,
          why we collect it, how it is stored, and the choices you have over your information.
        </p>

        {/* Sections */}
        <div className="policy-sections">
          {sections.map((s, i) => (
            <motion.div key={i} className="policy-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}>
              <h2 className="policy-section-title">{s.title}</h2>
              <p className="policy-section-body">{s.body}</p>
            </motion.div>
          ))}
        </div>

        <Link to="/register" className="policy-back-btn">
          <FiArrowLeft size={16} />
          Back to Registration
        </Link>
      </div>
    </div>
  )
}
