import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiShield } from 'react-icons/fi'

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating an account on BudgetPro, you agree to these Terms of Service. If you do not agree, please do not use the service. We may update these terms from time to time; continued use of the service constitutes acceptance of any changes.`,
  },
  {
    title: '2. Description of Service',
    body: `BudgetPro is a personal finance management platform that helps you track income, expenses, savings goals, EMI loans, and recurring transactions. The service is provided for personal, non-commercial use only.`,
  },
  {
    title: '3. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during registration. You must notify us immediately of any unauthorised use of your account. Each user may maintain only one account.`,
  },
  {
    title: '4. Acceptable Use',
    body: `You agree not to misuse the service. Prohibited activities include: attempting to gain unauthorised access to other users' accounts or our systems; uploading malicious code; using the service for illegal activities; impersonating another person; or interfering with the proper functioning of the platform.`,
  },
  {
    title: '5. Financial Data',
    body: `BudgetPro stores the financial data you enter (transactions, budgets, goals) to provide the service. This data belongs to you. We do not share your financial data with third parties for commercial purposes. You can delete your account and associated data at any time from your Profile settings.`,
  },
  {
    title: '6. Intellectual Property',
    body: `The BudgetPro platform, including its design, code, and content, is owned by us and protected by intellectual property laws. You retain ownership of the data you enter. You grant us a limited licence to store and process your data solely for the purpose of providing the service.`,
  },
  {
    title: '7. Disclaimer of Warranties',
    body: `BudgetPro is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free. The service is a budgeting tool and does not constitute financial, investment, or legal advice.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by law, BudgetPro shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including any loss of data or financial decisions made based on information displayed in the app.`,
  },
  {
    title: '9. Termination',
    body: `We reserve the right to suspend or terminate your account if you violate these terms. You may delete your account at any time. Upon termination, your data will be removed from our systems within 30 days.`,
  },
  {
    title: '10. Contact',
    body: `If you have questions about these Terms of Service, please contact us through the in-app support or via our official email address listed on the platform.`,
  },
]

export default function TermsPage() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        {/* Header */}
        <div className="policy-header">
          <div className="policy-icon">
            <FiShield size={24} />
          </div>
          <div>
            <h1 className="policy-title">Terms of Service</h1>
            <p className="policy-meta">BudgetPro · Last updated May 2025</p>
          </div>
        </div>

        <p className="policy-intro">
          Please read these Terms of Service carefully before using BudgetPro. These terms govern
          your access to and use of our personal finance management platform.
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
