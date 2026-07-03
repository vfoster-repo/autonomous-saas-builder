import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getStats(userId: string) {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [ytdTrips, ytdExpenses, mtdTrips, totalTrips] = await Promise.all([
    prisma.trip.findMany({ where: { userId, date: { gte: startOfYear } } }),
    prisma.expense.aggregate({ where: { userId, date: { gte: startOfYear } }, _sum: { amount: true } }),
    prisma.trip.aggregate({ where: { userId, date: { gte: startOfMonth } }, _sum: { grossPay: true, miles: true }, _count: { id: true } }),
    prisma.trip.count({ where: { userId } }),
  ])
  const ytdRevenue = ytdTrips.reduce((s, t) => s + t.grossPay, 0)
  const ytdMiles = ytdTrips.reduce((s, t) => s + t.miles, 0)
  const ytdExpenseTotal = ytdExpenses._sum.amount ?? 0
  return { ytdRevenue, ytdMiles, ytdExpenseTotal, ytdNetIncome: ytdRevenue - ytdExpenseTotal,
    mtdRevenue: mtdTrips._sum.grossPay ?? 0, mtdMiles: mtdTrips._sum.miles ?? 0,
    mtdTrips: mtdTrips._count.id, totalTrips }
}

export default async function DashboardPage() {
  const session = await auth()
  const stats = await getStats(session!.user.id)
  const isDemo = session!.user.role === 'demo'

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const fmtN = (n: number) => n.toLocaleString()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {isDemo && (
        <div className="bg-blue-900/30 border border-blue-700 text-blue-300 rounded-lg px-4 py-3 text-sm">
          You&apos;re viewing the <strong>demo account</strong> — all data is sample data. <Link href="/signup" className="underline hover:text-blue-100">Create your own account →</Link>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Year-to-date performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="YTD Revenue" value={fmt(stats.ytdRevenue)} />
        <StatCard label="YTD Expenses" value={fmt(stats.ytdExpenseTotal)} />
        <StatCard label="YTD Net Income" value={fmt(stats.ytdNetIncome)} positive={stats.ytdNetIncome > 0} />
        <StatCard label="Total Miles" value={fmtN(stats.ytdMiles)} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="This Month Revenue" value={fmt(stats.mtdRevenue)} small />
        <StatCard label="This Month Miles" value={fmtN(stats.mtdMiles)} small />
        <StatCard label="This Month Trips" value={String(stats.mtdTrips)} small />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/trips" className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 block">
          <div className="text-sm text-gray-400">Total Trips Logged</div>
          <div className="text-3xl font-bold text-white mt-1">{fmtN(stats.totalTrips)}</div>
          <div className="text-blue-400 text-sm mt-3">View all trips →</div>
        </Link>
        <Link href="/reports" className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 block">
          <div className="text-sm text-gray-400">P&amp;L Report</div>
          <div className="text-3xl font-bold text-white mt-1">View</div>
          <div className="text-blue-400 text-sm mt-3">Open full report →</div>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, positive, small }: { label: string; value: string; positive?: boolean; small?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`font-bold text-white mt-1 ${small ? 'text-xl' : 'text-2xl'} ${positive === false ? 'text-red-400' : ''}`}>{value}</div>
    </div>
  )
}
