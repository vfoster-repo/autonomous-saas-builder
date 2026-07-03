import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-xl font-bold text-white">TruckerFlow</span>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm">Sign In</Link>
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">Track every mile,<br />every dollar.</h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          TruckerFlow is the data platform built for owner-operators and lease operators.
          Log trips, track expenses, and see where your money goes — no insights, no fluff, just your numbers.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-medium">Start for $5</Link>
          <Link href="/login?demo=1" className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-3 rounded-lg text-lg font-medium">
            Try Demo →
          </Link>
        </div>
        <p className="text-gray-600 text-sm mt-4">$5 first month · $29/mo after · Cancel anytime</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '🚛', title: 'Trip Logging', desc: 'Log loaded + deadhead miles, gross pay, and broker. Every CPM calculation uses total miles.' },
          { icon: '💰', title: 'Expense Tracking', desc: 'Fuel, maintenance, insurance, driver pay, taxes — categorize everything. Upload receipts with AI scanning.' },
          { icon: '📊', title: 'P&L Reports', desc: 'Monthly revenue vs expenses, expense breakdown by category, IFTA mileage report. All actuals, no projections.' },
          { icon: '📋', title: 'Settlement Scanner', desc: 'Photograph your carrier settlement. Claude extracts loads and deductions automatically — staged for your review.' },
          { icon: '🏦', title: 'Bank Statement Import', desc: 'Upload a CSV or scan a statement. Duplicate detection, smart categorization, one-click approve.' },
          { icon: '🧮', title: 'Projection Calculator', desc: 'Set your cost rows and see what you need to earn. Per-load estimates and monthly projections side-by-side.' },
        ].map((f) => (
          <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Trial', price: '$5', period: 'first month', desc: 'Try everything. Full access.' },
            { name: 'Monthly', price: '$29', period: '/month', desc: 'Full access. Cancel anytime.', highlight: true },
            { name: 'Annual', price: '$240', period: '/year', desc: '$20/month — save $108/year.' },
          ].map((p) => (
            <div key={p.name} className={`rounded-xl p-6 border ${p.highlight ? 'bg-blue-900/30 border-blue-600' : 'bg-gray-900 border-gray-800'}`}>
              <div className="text-gray-400 text-sm mb-1">{p.name}</div>
              <div className="text-4xl font-bold text-white">{p.price}<span className="text-gray-400 text-base font-normal"> {p.period}</span></div>
              <p className="text-gray-400 text-sm mt-2 mb-6">{p.desc}</p>
              <Link href="/signup" className={`block text-center py-2 rounded-lg text-sm font-medium ${p.highlight ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'border border-gray-600 hover:border-gray-400 text-gray-300'}`}>Get started</Link>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">No refunds. Cancel anytime — access continues until period ends.</p>
      </section>

      {/* Try Demo */}
      <section className="max-w-2xl mx-auto px-6 pb-20 text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-3">See it in action</h2>
          <p className="text-gray-400 mb-6">Log in with the demo account to explore 12 months of real OTR data — 132 trips, $248K revenue, full expense history.</p>
          <Link href="/login?email=demo@truckerflow.com&demo=1" className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium">
            Open Demo Account →
          </Link>
          <p className="text-gray-600 text-xs mt-3">demo@truckerflow.com · password: demo · read-only</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/legal/terms" className="hover:text-gray-400">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-gray-400">Privacy</Link>
          <Link href="/legal/disclaimer" className="hover:text-gray-400">Disclaimer</Link>
        </div>
        <p>TruckerFlow is a data-storage and reporting tool. It does not provide financial, tax, or legal advice.</p>
        <p className="mt-1">Results vary. Past earnings do not guarantee future income. Consult a licensed professional for tax advice.</p>
      </footer>
    </div>
  )
}
