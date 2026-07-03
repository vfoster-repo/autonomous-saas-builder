export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: January 1, 2025</p>
        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <p>TruckerFlow collects and processes only the data necessary to provide the service.</p>
          <h2 className="text-white font-semibold">What we collect</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-400"><li>Email address and name (for account creation)</li><li>Trip and expense data you enter</li><li>Payment information (processed by Stripe — we never see card numbers)</li></ul>
          <h2 className="text-white font-semibold">How we use it</h2>
          <p>Your data is used solely to provide the service. We do not sell or share your data with third parties for marketing purposes.</p>
          <h2 className="text-white font-semibold">Data security</h2>
          <p>All data is encrypted in transit (HTTPS) and at rest. Passwords are hashed with bcrypt.</p>
          <h2 className="text-white font-semibold">Data deletion</h2>
          <p>You may request deletion of your account and all associated data by contacting support@truckerflow.vfoster.pro.</p>
          <h2 className="text-white font-semibold">Contact</h2>
          <p>Privacy questions: support@truckerflow.vfoster.pro</p>
        </div>
      </div>
    </div>
  )
}
