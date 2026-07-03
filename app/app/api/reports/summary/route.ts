import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year + 1, 0, 1)

  const [trips, expenses] = await Promise.all([
    prisma.trip.findMany({ where: { userId: session.user.id, date: { gte: startDate, lt: endDate } }, orderBy: { date: 'asc' } }),
    prisma.expense.findMany({ where: { userId: session.user.id, date: { gte: startDate, lt: endDate } } }),
  ])

  const totalRevenue = trips.reduce((s, t) => s + t.grossPay, 0)
  const totalMiles = trips.reduce((s, t) => s + t.miles, 0)
  const totalDeadhead = trips.reduce((s, t) => s + (t.deadheadMiles ?? 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netIncome = totalRevenue - totalExpenses
  const rpm = totalMiles > 0 ? totalRevenue / totalMiles : 0

  const monthly: Record<string, { revenue: number; expenses: number; miles: number; tripCount: number }> = {}
  for (let m = 0; m < 12; m++) {
    const key = String(m + 1).padStart(2, '0')
    monthly[key] = { revenue: 0, expenses: 0, miles: 0, tripCount: 0 }
  }
  trips.forEach(t => {
    const key = String(t.date.getMonth() + 1).padStart(2, '0')
    if (monthly[key]) { monthly[key].revenue += t.grossPay; monthly[key].miles += t.miles; monthly[key].tripCount += 1 }
  })
  expenses.forEach(e => {
    const key = String(e.date.getMonth() + 1).padStart(2, '0')
    if (monthly[key]) monthly[key].expenses += e.amount
  })

  const byCategory: Record<string, number> = {}
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount })

  return NextResponse.json({
    year, totalRevenue, totalMiles, totalDeadhead, totalExpenses, netIncome, rpm,
    tripCount: trips.length, expenseCount: expenses.length,
    monthly: Object.entries(monthly).map(([month, v]) => ({ month: `${year}-${month}`, ...v, netIncome: v.revenue - v.expenses })),
    byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
  })
}
