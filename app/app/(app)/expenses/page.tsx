'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

const CATEGORIES = ['Fuel', 'Truck Payment', 'Trailer Payment', 'Insurance', 'Maintenance', 'Tires', 'Tolls', 'Permits', 'Taxes', 'Other']

type Expense = { id: string; date: string; category: string; amount: number; description?: string | null }

export default function ExpensesPage() {
  const { data: session } = useSession()
  const isDemo = session?.user?.role === 'demo'
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: '', category: 'Fuel', amount: '', description: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/expenses?page=${page}&limit=50`)
    const data = await res.json()
    setExpenses(data.expenses ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  async function save() {
    const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: +form.amount }) })
    if (res.ok) { setShowForm(false); setForm({ date: '', category: 'Fuel', amount: '', description: '' }); load() }
  }

  async function del(id: string) {
    if (!confirm('Delete this expense?')) return
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    load()
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const inputCls = 'bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-full focus:outline-none focus:border-blue-500'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} total</p>
        </div>
        {!isDemo && <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">+ Add Expense</button>}
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-white font-semibold">New Expense</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className={inputCls} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-gray-400 block mb-1">Amount ($)</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className={inputCls} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Description</label><input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={inputCls} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-700 text-gray-300 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
            <th className="text-left px-4 py-3">Date</th>
            <th className="text-left px-4 py-3">Category</th>
            <th className="text-left px-4 py-3">Description</th>
            <th className="text-right px-4 py-3">Amount</th>
            {!isDemo && <th className="px-4 py-3"></th>}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center text-gray-500 py-8">Loading…</td></tr> :
             expenses.length === 0 ? <tr><td colSpan={5} className="text-center text-gray-500 py-8">No expenses yet</td></tr> :
             expenses.map(e => (
              <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-300">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-white">{e.category}</td>
                <td className="px-4 py-3 text-gray-400">{e.description || '—'}</td>
                <td className="px-4 py-3 text-right text-red-400 font-medium">{fmt(e.amount)}</td>
                {!isDemo && <td className="px-4 py-3 text-right"><button onClick={() => del(e.id)} className="text-red-400 hover:text-red-300 text-xs">Del</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 50)}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border border-gray-700 text-gray-300 px-3 py-1 rounded text-sm disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total} className="border border-gray-700 text-gray-300 px-3 py-1 rounded text-sm disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
