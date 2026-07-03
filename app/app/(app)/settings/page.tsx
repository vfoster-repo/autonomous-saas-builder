'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const isDemo = session?.user?.role === 'demo'
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => { if (s) setSettings(s) })
  }, [])

  const set = (key: string, val: unknown) => setSettings(s => ({ ...s, [key]: val }))
  const n = (key: string, fallback = 0) => Number(settings[key] ?? fallback)
  const s = (key: string, fallback = '') => String(settings[key] ?? fallback)

  async function save() {
    if (isDemo) return
    setSaving(true)
    await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const inputCls = 'bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-full focus:outline-none focus:border-blue-500 disabled:opacity-50'
  const labelCls = 'text-xs text-gray-400 block mb-1'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        {!isDemo && (
          <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm">
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>

      {isDemo && <div className="bg-blue-900/30 border border-blue-700 text-blue-300 rounded-lg px-4 py-3 text-sm">Demo account — settings are read-only.</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-gray-200">Truck Info</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Year</label><input disabled={isDemo} value={s('truckYear')} onChange={e => set('truckYear', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Make</label><input disabled={isDemo} value={s('truckMake')} onChange={e => set('truckMake', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Model</label><input disabled={isDemo} value={s('truckModel')} onChange={e => set('truckModel', e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Trailer Type</label>
            <select disabled={isDemo} value={s('trailerType', 'rental_trailer')} onChange={e => set('trailerType', e.target.value)} className={inputCls}>
              <option value="owned_trailer">Owned Trailer</option>
              <option value="rental_trailer">Rental/Lease Trailer</option>
              <option value="power_only">Power Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-gray-200">Mileage & Fixed Costs</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Avg miles/month</label><input type="number" disabled={isDemo} value={n('avgMilesPerMonth', 10000)} onChange={e => set('avgMilesPerMonth', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Deadhead %</label><input type="number" disabled={isDemo} value={n('avgDeadheadPct', 15)} onChange={e => set('avgDeadheadPct', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Truck payment ($/mo)</label><input type="number" disabled={isDemo} value={n('truckPayment')} onChange={e => set('truckPayment', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Trailer payment ($/mo)</label><input type="number" disabled={isDemo} value={n('trailerPayment')} onChange={e => set('trailerPayment', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Insurance ($/mo)</label><input type="number" disabled={isDemo} value={n('insurance')} onChange={e => set('insurance', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Other fixed ($/mo)</label><input type="number" disabled={isDemo} value={n('otherFixed')} onChange={e => set('otherFixed', +e.target.value)} className={inputCls} /></div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-gray-200">Fuel & Variable CPM</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Fuel cost/gallon ($)</label><input type="number" step="0.01" disabled={isDemo} value={n('avgFuelCostPerGallon', 3.55)} onChange={e => set('avgFuelCostPerGallon', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Avg MPG</label><input type="number" step="0.1" disabled={isDemo} value={n('avgMpg', 7.2)} onChange={e => set('avgMpg', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Repair & maint ($/mi)</label><input type="number" step="0.001" disabled={isDemo} value={n('repairMaintenance', 0.198)} onChange={e => set('repairMaintenance', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Tires ($/mi)</label><input type="number" step="0.001" disabled={isDemo} value={n('tires', 0.047)} onChange={e => set('tires', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Tolls ($/mi)</label><input type="number" step="0.001" disabled={isDemo} value={n('tolls', 0.038)} onChange={e => set('tolls', +e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Permits ($/mi)</label><input type="number" step="0.001" disabled={isDemo} value={n('permits', 0.009)} onChange={e => set('permits', +e.target.value)} className={inputCls} /></div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-gray-200">Tax Settings</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Federal bracket</label>
            <select disabled={isDemo} value={s('federalBracket', '22')} onChange={e => set('federalBracket', e.target.value)} className={inputCls}>
              {['10','12','22','24','32','37'].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div><label className={labelCls}>State tax rate (%)</label><input type="number" step="0.1" disabled={isDemo} value={n('stateRate')} onChange={e => set('stateRate', +e.target.value)} className={inputCls} /></div>
        </div>
        <div className="bg-gray-800 rounded px-3 py-2 text-xs text-gray-400">SE Tax (15.3%) is the federal self-employment rate and is read-only.</div>
      </div>
    </div>
  )
}
