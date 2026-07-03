export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Earnings &amp; Tax Disclaimer</h1>
        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded-lg p-4">
            <p className="font-semibold mb-2">Important Notice</p>
            <p>TruckerFlow is a data tracking tool, not a financial advisor or tax professional.</p>
          </div>
          <h2 className="text-white font-semibold">Earnings</h2>
          <p>Any revenue figures, projections, or rate-per-mile calculations shown in TruckerFlow are based solely on data you provide. Past performance does not guarantee future results. Individual results vary based on market conditions, fuel prices, cargo availability, equipment costs, and many other factors outside our control.</p>
          <h2 className="text-white font-semibold">Taxes</h2>
          <p>Tax estimates provided by the Calculator are rough approximations based on the bracket rates you enter. They do not account for deductions, credits, quarterly payments, state-specific rules, or other factors that affect your actual tax liability. Consult a licensed CPA or tax professional before making any tax decisions.</p>
          <h2 className="text-white font-semibold">Not Financial Advice</h2>
          <p>Nothing in TruckerFlow constitutes financial, investment, legal, or tax advice. Always consult qualified professionals for advice specific to your situation.</p>
        </div>
      </div>
    </div>
  )
}
