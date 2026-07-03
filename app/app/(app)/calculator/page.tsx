'use client'
import { useState, useEffect } from 'react'

export default function CalculatorPage() {
  const [miles, setMiles] = useState(10000)
  const [rpm, setRpm] = useState(2.74)
  const [deadheadPct, setDeadheadPct] = useState(15)
  const [fuelCostPerGallon, setFuelCostPerGallon] = useState(3.65)
  const [mpg, setMpg] = useState(7.2)
  const [truckPayment, setTruckPayment] = useState(2800)
  const [trailerPayment, setTrailerPayment] = useState(650)
  const [insurance, setInsurance] = useState(950)
  const [otherFixed, setOtherFixed] = useState(0)
  const [repairCpm, setRepairCpm] = useState(0.198)
  const [tiresCpm, setTiresCpm] = useState(0.047)
  const [tollsCpm, setTollsCpm] = useState(0.038)
  const [permitsCpm, setPermitsCpm] = useState(0.009)
  const [federalRate, setFederalRate] = useState(22)
  const [stateRate, setStateRate] = useState(5)

  const SE_RATE = 15.3
  const revenue = miles * rpm
  const fuelCpm = mpg > 0 ? fuelCostPerGallon / mpg : 0
  const variableCpm = fuelCpm + repairCpm + tiresCpm + tollsCpm + permitsCpm
  const variableTotal = variableCpm * miles
  const fixedTotal = truckPayment + trailerPayment + insurance + otherFixed
  const totalExpenses = variableTotal + fixedTotal
  const netProfit = revenue - totalExpenses
  const netProfitPct = revenue > 0 ? (netProfit / revenue) * 100 : 0
  const seTax = Math.max(0, netProfit) * (SE_RATE / 100)
  const federalTax = Math.max(0, netProfit - seTax) * (federalRate / 100)
  const stateTax = Math.max(0, netProfit) * (stateRate / 100)
  const totalTax = seTax + federalTax + stateTax
  const afterTax = netProfit - totalTax
  const effectiveCpm = miles > 0 ? totalExpenses / miles : 0
  const breakEvenRpm = miles > 0 ? totalExpenses / miles : 0

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const inputCls = 'bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white w-full focus:outline-none focus:border-blue-500'
  const labelCls = 'text-xs text-gray-400 block mb-1'

  // Load from settings on mount
  useEffect(() => {
    fetch('/truckerflow-v7/api/settings').then(r => r.json()).then(s => {
      if (!s) return
      if (s.avgMilesPerMonth) setMiles(s.avgMilesPerMonth)
      if (s.avgFuelCostPerGallon) setFuelCostPerGallon(s.avgFuelCostPerGallon)
      if (s.avgMpg) setMpg(s.avgMpg)
      if (s.truckPayment) setTruckPayment(s.truckPayment)
      if (s.trailerPayment) setTrailerPayment(s.trailerPayment)
      if (s.insurance) setInsurance(s.insurance)
      if (s.otherFixed) setOtherFixed(s.otherFixed)
      if (s.repairMaintenance) setRepairCpm(s.repairMaintenance)
      if (s.tires) setTiresCpm(s.tires)
      if (s.tolls) setTollsCpm(s.tolls)
      if (s.permits) setPermitsCpm(s.permits)
      if (s.avgDeadheadPct) setDeadheadPct(s.avgDeadheadPct)
      if (s.federalBracket) setFederalRate(+s.federalBracket)
      if (s.stateRate) setStateRate(s.stateRate)
    })
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Load Calculator</h1>
        <p className="text-gray-400 text-sm">Estimate your true cost-per-mile and break-even rate</p>
      </div>
      <div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded-lg px-4 py-3 text-xs">
        This calculator provides estimates only and does not constitute financial or tax advice. Tax amounts are rough estimates — consult a licensed tax professional.
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-gray-200">Load / Revenue</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Miles this month</label><input type="number" value={miles} onChange={e => setMiles(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Rate per mile ($)</label><input type="number" step="0.01" value={rpm} onChange={e => setRpm(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Deadhead % </label><input type="number" value={deadheadPct} onChange={e => setDeadheadPct(+e.target.value)} className={inputCls} /></div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-gray-200">Fixed Monthly Costs</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Truck payment ($/mo)</label><input type="number" value={truckPayment} onChange={e => setTruckPayment(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Trailer payment ($/mo)</label><input type="number" value={trailerPayment} onChange={e => setTrailerPayment(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Insurance ($/mo)</label><input type="number" value={insurance} onChange={e => setInsurance(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Other fixed ($/mo)</label><input type="number" value={otherFixed} onChange={e => setOtherFixed(+e.target.value)} className={inputCls} /></div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-gray-200">Variable Costs (per mile)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Fuel cost/gal ($)</label><input type="number" step="0.01" value={fuelCostPerGallon} onChange={e => setFuelCostPerGallon(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>MPG</label><input type="number" step="0.1" value={mpg} onChange={e => setMpg(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Repair & maint. ($/mi)</label><input type="number" step="0.001" value={repairCpm} onChange={e => setRepairCpm(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Tires ($/mi)</label><input type="number" step="0.001" value={tiresCpm} onChange={e => setTiresCpm(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Tolls ($/mi)</label><input type="number" step="0.001" value={tollsCpm} onChange={e => setTollsCpm(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Permits ($/mi)</label><input type="number" step="0.001" value={permitsCpm} onChange={e => setPermitsCpm(+e.target.value)} className={inputCls} /></div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-gray-200">Tax Rates (estimate)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Federal bracket (%)</label><input type="number" value={federalRate} onChange={e => setFederalRate(+e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>State rate (%)</label><input type="number" value={stateRate} onChange={e => setStateRate(+e.target.value)} className={inputCls} /></div>
              <div className="col-span-2 bg-gray-800 rounded px-3 py-2 text-xs text-gray-400">SE Tax: 15.3% (IRS rate, fixed)</div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-gray-200">Summary</h3>
            <Row label="Gross Revenue" value={fmt(revenue)} accent="green" />
            <Row label="Variable Costs" value={`−${fmt(variableTotal)}`} accent="red" />
            <Row label="Fixed Costs" value={`−${fmt(fixedTotal)}`} accent="red" />
            <div className="border-t border-gray-700 pt-2">
              <Row label="Net Profit (pre-tax)" value={fmt(netProfit)} accent={netProfit >= 0 ? 'green' : 'red'} bold />
              <Row label="Net Margin" value={`${netProfitPct.toFixed(1)}%`} />
            </div>
            <div className="border-t border-gray-700 pt-2">
              <Row label="SE Tax (15.3%)" value={`−${fmt(seTax)}`} accent="yellow" />
              <Row label={`Federal (${federalRate}%)`} value={`−${fmt(federalTax)}`} accent="yellow" />
              <Row label={`State (${stateRate}%)`} value={`−${fmt(stateTax)}`} accent="yellow" />
            </div>
            <div className="border-t border-gray-700 pt-2">
              <Row label="After-Tax Income" value={fmt(afterTax)} accent={afterTax >= 0 ? 'green' : 'red'} bold />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-gray-200">Cost Analysis</h3>
            <Row label="Total CPM" value={`$${effectiveCpm.toFixed(3)}/mi`} />
            <Row label="Fuel CPM" value={`$${fuelCpm.toFixed(3)}/mi`} />
            <Row label="Variable CPM" value={`$${variableCpm.toFixed(3)}/mi`} />
            <Row label="Break-even RPM" value={`$${breakEvenRpm.toFixed(3)}/mi`} bold />
            <Row label="Loaded miles" value={`${Math.round(miles * (1 - deadheadPct/100)).toLocaleString()} mi`} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: 'green' | 'red' | 'yellow'; bold?: boolean }) {
  const color = accent === 'green' ? 'text-green-400' : accent === 'red' ? 'text-red-400' : accent === 'yellow' ? 'text-yellow-300' : 'text-gray-300'
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm ${color} ${bold ? 'font-bold text-base' : ''}`}>{value}</span>
    </div>
  )
}
