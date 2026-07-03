import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-4">Simple pricing for owner-operators</h1>
        <p className="text-center text-gray-400 mb-12">No hidden fees. Cancel anytime.</p>

        <div className="grid md:grid-cols-3 gap-6">
          <PlanCard name="Trial" price="$5" period="/ month" description="Try everything for your first month" features={['Trip & expense tracking','P&L reports','Load calculator','1 month only']} href="/signup" cta="Start Trial" />
          <PlanCard name="Monthly" price="$29" period="/ month" description="Full access, cancel anytime" features={['All features','CSV & bank import','AI receipt scanner','Settlement scanner','Priority support']} href="/signup" cta="Get Started" highlight />
          <PlanCard name="Annual" price="$20" period="/ month" description="Billed $240/year — save $108" features={['Everything in Monthly','2 months free','Early access to new features']} href="/signup" cta="Save 31%" />
        </div>

        <p className="text-center text-xs text-gray-600 mt-12">
          Results are not guaranteed. Earnings vary by operator, market, and conditions. See our{' '}
          <Link href="/legal/disclaimer" className="underline hover:text-gray-400">earnings disclaimer</Link>.
        </p>
      </div>
    </div>
  )
}

function PlanCard({ name, price, period, description, features, href, cta, highlight }: {
  name: string; price: string; period: string; description: string; features: string[]; href: string; cta: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-6 border flex flex-col ${highlight ? 'bg-blue-900/20 border-blue-600' : 'bg-gray-900 border-gray-800'}`}>
      <div className="text-sm font-medium text-gray-400 mb-2">{name}</div>
      <div className="mb-2"><span className="text-3xl font-bold text-white">{price}</span><span className="text-gray-400 text-sm">{period}</span></div>
      <p className="text-xs text-gray-400 mb-5">{description}</p>
      <ul className="space-y-2 flex-1">
        {features.map(f => <li key={f} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-blue-400 mt-0.5">✓</span>{f}</li>)}
      </ul>
      <Link href={href} className={`mt-6 text-center py-2 rounded-lg text-sm font-medium ${highlight ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'border border-gray-700 hover:border-gray-500 text-gray-300'}`}>{cta}</Link>
    </div>
  )
}
