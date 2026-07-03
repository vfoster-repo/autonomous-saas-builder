'use client'
import { useState, useEffect } from 'react'

type Summary = { year: number; totalRevenue: number; totalMiles: number; totalExpenses: number; netIncome: number; rpm: number; tripCount: number;
  monthly: { month: string; revenue: number; expenses: number; miles: number; tripCount: number; netIncome: number }[];
  byCategory: { category: string; amount: number }[] }

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/truckerflow-v7/api/reports/summary?year=${year}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [year])

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const monthName = (m: string) => new Date(m + '-15').toLocaleString('default', { month: 'short' })

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>
  if (!data) return null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">P&amp;L Report</h1>
        <select value={year} onChange={e => setYear(+e.target.value)} className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenue" value={fmt(data.totalRevenue)} />
        <Stat label="Expenses" value={fmt(data.totalExpenses)} />
        <Stat label="Net Income" value={fmt(data.netIncome)} pos={data.netIncome >= 0} />
        <Stat label="Avg RPM" value={`$${data.rpm.toFixed(2)}`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 text-sm font-medium text-gray-300">Monthly Breakdown</div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
            <th className="text-left px-4 py-2">Month</th>
            <th className="text-right px-4 py-2">Trips</th>
            <th className="text-right px-4 py-2">Miles</th>
            <th className="text-right px-4 py-2">Revenue</th>
            <th className="text-right px-4 py-2">Expenses</th>
            <th className="text-right px-4 py-2">Net</th>
          </tr></thead>
          <tbody>
            {data.monthly.map(m => (
              <tr key={m.month} className="border-b border-gray-800/50">
                <td className="px-4 py-2 text-gray-300">{monthName(m.month)}</td>
                <td className="px-4 py-2 text-right text-gray-400">{m.tripCount}</td>
                <td className="px-4 py-2 text-right text-gray-400">{m.miles.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-green-400">{fmt(m.revenue)}</td>
                <td className="px-4 py-2 text-right text-red-400">{fmt(m.expenses)}</td>
                <td className={`px-4 py-2 text-right font-medium ${m.netIncome >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(m.netIncome)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-700 bg-gray-800/50">
              <td className="px-4 py-2 text-white font-semibold">Total</td>
              <td className="px-4 py-2 text-right text-gray-300">{data.tripCount}</td>
              <td className="px-4 py-2 text-right text-gray-300">{data.totalMiles.toLocaleString()}</td>
              <td className="px-4 py-2 text-right text-green-400 font-semibold">{fmt(data.totalRevenue)}</td>
              <td className="px-4 py-2 text-right text-red-400 font-semibold">{fmt(data.totalExpenses)}</td>
              <td className={`px-4 py-2 text-right font-semibold ${data.netIncome >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(data.netIncome)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {data.byCategory.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 text-sm font-medium text-gray-300">Expenses by Category</div>
          <div className="p-4 space-y-2">
            {data.byCategory.map(c => (
              <div key={c.category} className="flex items-center gap-3">
                <div className="text-sm text-gray-300 w-40 flex-shrink-0">{c.category}</div>
                <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, (c.amount / data.totalExpenses) * 100)}%` }} />
                </div>
                <div className="text-sm text-gray-400 w-24 text-right">{fmt(c.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, pos }: { label: string; value: string; pos?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${pos === false ? 'text-red-400' : 'text-white'}`}>{value}</div>
    </div>
  )
}
