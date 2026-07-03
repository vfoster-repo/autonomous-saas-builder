'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3 | 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [operatorType, setOperatorType] = useState('owner_operator')
  const [truckYear, setTruckYear] = useState('')
  const [truckMake, setTruckMake] = useState('')
  const [truckModel, setTruckModel] = useState('')
  const [truckVin, setTruckVin] = useState('')
  const [trailerType, setTrailerType] = useState('rental_trailer')

  // Step 2
  const [avgMilesPerMonth, setAvgMilesPerMonth] = useState(10000)
  const [avgDeadheadPct, setAvgDeadheadPct] = useState(15)
  const [truckPayment, setTruckPayment] = useState(0)
  const [trailerPayment, setTrailerPayment] = useState(0)
  const [insurance, setInsurance] = useState(0)
  const [otherFixed, setOtherFixed] = useState(0)

  // Step 3
  const [avgFuelCostPerGallon, setAvgFuelCostPerGallon] = useState(3.55)
  const [avgMpg, setAvgMpg] = useState(7.2)
  const [repairMaintenance, setRepairMaintenance] = useState(0.198)
  const [tires, setTires] = useState(0.047)
  const [tolls, setTolls] = useState(0.038)
  const [permits, setPermits] = useState(0.009)

  // Step 4
  const [federalBracket, setFederalBracket] = useState('22')
  const [stateRate, setStateRate] = useState(0)

  const fuelCpm = avgMpg > 0 ? (avgFuelCostPerGallon / avgMpg).toFixed(3) : '—'

  async function finish() {
    setSaving(true)
    await fetch('/truckerflow-v7/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorType, truckYear, truckMake, truckModel, truckVin, trailerType,
        avgMilesPerMonth, avgDeadheadPct, truckPayment, trailerPayment, insurance, otherFixed,
        avgFuelCostPerGallon, avgMpg, repairMaintenance, tires, tolls, permits,
        federalBracket, stateRate,
        onboardingCompleted: true,
      }),
    })
    setSaving(false)
    router.push('/dashboard')
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-sm text-gray-300 mb-1'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-800'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Tell us about yourself</h2>
            <div>
              <label className={labelCls}>Are you an owner-operator or lease operator?</label>
              <select value={operatorType} onChange={e => setOperatorType(e.target.value)} className={inputCls}>
                <option value="owner_operator">Owner-Operator (I own my truck)</option>
                <option value="lease_operator">Lease Operator (I lease from a carrier)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Truck Year</label><input type="text" value={truckYear} onChange={e => setTruckYear(e.target.value)} placeholder="2020" className={inputCls} /></div>
              <div><label className={labelCls}>Make</label><input type="text" value={truckMake} onChange={e => setTruckMake(e.target.value)} placeholder="Peterbilt" className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Model</label><input type="text" value={truckModel} onChange={e => setTruckModel(e.target.value)} placeholder="389" className={inputCls} /></div>
              <div><label className={labelCls}>VIN <span className="text-gray-600">(optional)</span></label><input type="text" value={truckVin} onChange={e => setTruckVin(e.target.value)} className={inputCls} /></div>
            </div>
            <div>
              <label className={labelCls}>Trailer Type</label>
              <select value={trailerType} onChange={e => setTrailerType(e.target.value)} className={inputCls}>
                <option value="owned_trailer">Owned Trailer</option>
                <option value="rental_trailer">Rental / Lease Trailer</option>
                <option value="power_only">Power Only (no trailer)</option>
              </select>
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium">Next →</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Financial settings</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Avg miles/month</label><input type="number" value={avgMilesPerMonth} onChange={e => setAvgMilesPerMonth(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Deadhead % <span className="text-gray-600">(empty miles)</span></label><input type="number" value={avgDeadheadPct} onChange={e => setAvgDeadheadPct(+e.target.value)} className={inputCls} /></div>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <p className="text-sm text-gray-400 mb-3">Fixed monthly costs</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Truck payment ($/mo)</label><input type="number" value={truckPayment} onChange={e => setTruckPayment(+e.target.value)} className={inputCls} /></div>
                {trailerType !== 'power_only' && <div><label className={labelCls}>Trailer payment ($/mo)</label><input type="number" value={trailerPayment} onChange={e => setTrailerPayment(+e.target.value)} className={inputCls} /></div>}
                <div><label className={labelCls}>Insurance ($/mo)</label><input type="number" value={insurance} onChange={e => setInsurance(+e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Other fixed ($/mo)</label><input type="number" value={otherFixed} onChange={e => setOtherFixed(+e.target.value)} className={inputCls} /></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 py-2 rounded-lg text-sm">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium">Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Per-mile cost settings</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Fuel cost / gallon ($)</label><input type="number" step="0.01" value={avgFuelCostPerGallon} onChange={e => setAvgFuelCostPerGallon(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Avg MPG</label><input type="number" step="0.1" value={avgMpg} onChange={e => setAvgMpg(+e.target.value)} className={inputCls} /></div>
            </div>
            <div className="bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-400">
              Derived fuel CPM: <span className="text-white font-mono">${fuelCpm}/mi</span>
            </div>
            <p className="text-xs text-gray-600">We&apos;ll update these automatically from your expense data.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Repair & maintenance ($/mi)</label><input type="number" step="0.001" value={repairMaintenance} onChange={e => setRepairMaintenance(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Tires ($/mi)</label><input type="number" step="0.001" value={tires} onChange={e => setTires(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Tolls ($/mi)</label><input type="number" step="0.001" value={tolls} onChange={e => setTolls(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Permits ($/mi)</label><input type="number" step="0.001" value={permits} onChange={e => setPermits(+e.target.value)} className={inputCls} /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 py-2 rounded-lg text-sm">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium">Next →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Tax settings</h2>
            <div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded-lg px-4 py-3 text-xs">
              TruckerFlow is not a tax advisor. These settings are used only for estimates in the calculator. Consult a licensed tax professional for actual tax advice.
            </div>
            <div>
              <label className={labelCls}>Federal income tax bracket</label>
              <select value={federalBracket} onChange={e => setFederalBracket(e.target.value)} className={inputCls}>
                <option value="10">10%</option>
                <option value="12">12%</option>
                <option value="22">22%</option>
                <option value="24">24%</option>
                <option value="32">32%</option>
                <option value="37">37%</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>State income tax rate (%)</label>
              <input type="number" step="0.1" value={stateRate} onChange={e => setStateRate(+e.target.value)} className={inputCls} />
            </div>
            <div className="bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-400">
              Self-employment tax: <span className="text-white">15.3%</span> <span className="text-gray-600">(read-only — IRS rate)</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 py-2 rounded-lg text-sm">← Back</button>
              <button onClick={finish} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium">
                {saving ? 'Saving…' : 'Finish Setup →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
