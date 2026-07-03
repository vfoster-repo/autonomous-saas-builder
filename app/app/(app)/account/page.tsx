import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AccountPage() {
  const session = await auth()
  const user = await prisma.user.findUnique({ where: { id: session!.user.id }, include: { subscription: true } })
  if (!user) return null

  const sub = user.subscription
  const planLabel = sub?.plan === 'annual' ? 'Annual ($20/mo)' : sub?.plan === 'monthly' ? 'Monthly ($29/mo)' : sub?.plan === 'trial' ? 'Trial ($5/mo)' : 'Inactive'
  const statusColor = sub?.status === 'active' ? 'text-green-400' : 'text-gray-400'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Account</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-gray-200">Profile</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-white">{user.name ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="text-white">{user.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Role</span><span className="text-white capitalize">{user.role}</span></div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-gray-200">Subscription</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Plan</span><span className="text-white">{planLabel}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Status</span><span className={statusColor}>{sub?.status ?? 'inactive'}</span></div>
          {sub?.currentPeriodEnd && <div className="flex justify-between"><span className="text-gray-400">Renews</span><span className="text-white">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span></div>}
        </div>
        {user.role !== 'demo' && (
          <div className="pt-2">
            <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm">Manage subscription →</Link>
          </div>
        )}
      </div>

      {user.role !== 'demo' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-medium text-gray-200">Danger Zone</h3>
          <p className="text-xs text-gray-500">Account deletion and data export coming soon.</p>
        </div>
      )}
    </div>
  )
}
