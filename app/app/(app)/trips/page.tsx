'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

type Trip = { id: string; date: string; origin: string; destination: string; miles: number; deadheadMiles: number; grossPay: number; broker?: string | null }

export default function TripsPage() {
  const { data: session } = useSession()
  const isDemo = session?.user?.role === 'demo'
  const [trips, setTrips] = useState<Trip[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: '', origin: '', destination: '', miles: '', deadheadMiles: '', grossPay: '', broker: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/trips?page=${page}&limit=50`)
    const data = await res.json()
    setTrips(data.trips ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  async function save() {
    const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, miles: +form.miles, deadheadMiles: +form.deadheadMiles || 0, grossPay: +form.grossPay }) })
    if (res.ok) { setShowForm(false); setForm({ date: '', origin: '', destination: '', miles: '', deadheadMiles: '', grossPay: '', broker: '' }); load() }
  }

  async function del(id: string) {
    if (!confirm('Delete this trip?')) return
    await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    load()
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const inputCls = 'bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-full focus:outline-none focus:border-blue-500'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trips</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} total</p>
        </div>
        {!isDemo && <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">+ Log Trip</button>}
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-white font-semibold">New Trip</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className={inputCls} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Broker</label><input value={form.broker} onChange={e => setForm(f => ({...f, broker: e.target.value}))} placeholder="CH Robinson" className={inputCls} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Origin</label><input value={form.origin} onChange={e => setForm(f => ({...f, origin: e.target.value}))} placeholder="Dallas, TX" className={inputCls} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Destination</label><input value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))} placeholder="Chicago, IL" className={inputCls} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Loaded Miles</label><input type="number" value={form.miles} onChange={e => setForm(f => ({...f, miles: e.target.value}))} className={inputCls} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Deadhead Miles</label><input type="number" value={form.deadheadMiles} onChange={e => setForm(f => ({...f, deadheadMiles: e.target.value}))} className={inputCls} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Gross Pay ($)</label><input type="number" value={form.grossPay} onChange={e => setForm(f => ({...f, grossPay: e.target.value}))} className={inputCls} /></div>
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
            <th className="text-left px-4 py-3">Route</th>
            <th className="text-right px-4 py-3">Miles</th>
            <th className="text-right px-4 py-3">DH</th>
            <th className="text-right px-4 py-3">Gross</th>
            <th className="text-right px-4 py-3">RPM</th>
            {!isDemo && <th className="px-4 py-3"></th>}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center text-gray-500 py-8">Loading…</td></tr> :
             trips.length === 0 ? <tr><td colSpan={7} className="text-center text-gray-500 py-8">No trips yet</td></tr> :
             trips.map(t => (
              <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-white">{t.origin} → {t.destination}</td>
                <td className="px-4 py-3 text-right text-gray-300">{t.miles.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-500">{t.deadheadMiles || '—'}</td>
                <td className="px-4 py-3 text-right text-green-400 font-medium">{fmt(t.grossPay)}</td>
                <td className="px-4 py-3 text-right text-gray-400">${(t.grossPay / t.miles).toFixed(2)}</td>
                {!isDemo && <td className="px-4 py-3 text-right"><button onClick={() => del(t.id)} className="text-red-400 hover:text-red-300 text-xs">Del</button></td>}
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
