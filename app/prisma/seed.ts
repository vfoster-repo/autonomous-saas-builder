import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ATA 2024 cost-per-mile benchmarks: 12 months May 2025–Apr 2026
// 132 trips, ~168 expenses, $248,901 gross, $2.74/mi avg, 90,919 total miles
const LANES = [
  { origin: 'Dallas, TX', destination: 'Chicago, IL', miles: 920, dhMiles: 85 },
  { origin: 'Chicago, IL', destination: 'Philadelphia, PA', miles: 760, dhMiles: 65 },
  { origin: 'Philadelphia, PA', destination: 'Atlanta, GA', miles: 860, dhMiles: 75 },
  { origin: 'Atlanta, GA', destination: 'Dallas, TX', miles: 780, dhMiles: 70 },
  { origin: 'Dallas, TX', destination: 'Denver, CO', miles: 880, dhMiles: 80 },
  { origin: 'Denver, CO', destination: 'Los Angeles, CA', miles: 1020, dhMiles: 90 },
  { origin: 'Los Angeles, CA', destination: 'Seattle, WA', miles: 1140, dhMiles: 95 },
  { origin: 'Seattle, WA', destination: 'Denver, CO', miles: 1320, dhMiles: 110 },
  { origin: 'Nashville, TN', destination: 'Charlotte, NC', miles: 410, dhMiles: 38 },
  { origin: 'Charlotte, NC', destination: 'Atlanta, GA', miles: 245, dhMiles: 22 },
]

const BROKERS = ['Coyote Logistics', 'Echo Global', 'CH Robinson', 'XPO Logistics', 'Transplace', 'Uber Freight']

const EXPENSE_TEMPLATES: { category: string; minAmount: number; maxAmount: number; frequency: 'monthly' | 'biweekly' | 'occasional' }[] = [
  { category: 'Fuel', minAmount: 800, maxAmount: 1400, frequency: 'biweekly' },
  { category: 'Fuel', minAmount: 700, maxAmount: 1200, frequency: 'biweekly' },
  { category: 'Truck Payment', minAmount: 2800, maxAmount: 2800, frequency: 'monthly' },
  { category: 'Trailer Payment', minAmount: 650, maxAmount: 650, frequency: 'monthly' },
  { category: 'Insurance', minAmount: 950, maxAmount: 950, frequency: 'monthly' },
  { category: 'Maintenance', minAmount: 180, maxAmount: 650, frequency: 'occasional' },
  { category: 'Tires', minAmount: 450, maxAmount: 950, frequency: 'occasional' },
  { category: 'Tolls', minAmount: 45, maxAmount: 220, frequency: 'biweekly' },
  { category: 'Permits', minAmount: 35, maxAmount: 120, frequency: 'monthly' },
  { category: 'Taxes', minAmount: 400, maxAmount: 900, frequency: 'occasional' },
  { category: 'Other', minAmount: 50, maxAmount: 300, frequency: 'occasional' },
]

function rng(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

function rand(r: () => number, min: number, max: number) {
  return min + r() * (max - min)
}

function pickItem<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)]
}

async function main() {
  console.log('Seeding demo account…')

  // Clean up existing demo data
  await prisma.user.deleteMany({ where: { email: 'demo@truckerflow.com' } })

  const password = await bcrypt.hash('demo', 12)

  const user = await prisma.user.create({
    data: {
      email: 'demo@truckerflow.com',
      password,
      name: 'Demo Driver',
      role: 'demo',
      operatorType: 'owner_operator',
      onboardingCompleted: true,
    },
  })

  await prisma.userSettings.create({
    data: {
      userId: user.id,
      trailerType: 'rental_trailer',
      avgMilesPerMonth: 7577,
      avgDeadheadPct: 15,
      avgFuelCostPerGallon: 3.65,
      avgMpg: 7.2,
      truckPayment: 2800,
      trailerPayment: 650,
      insurance: 950,
      otherFixed: 0,
      repairMaintenance: 0.198,
      tires: 0.047,
      tolls: 0.038,
      permits: 0.009,
      truckReservePerMile: 0.05,
      trailerReservePerMile: 0.02,
      federalBracket: '22',
      stateRate: 5,
    },
  })

  await prisma.subscription.create({
    data: {
      userId: user.id,
      status: 'active',
      plan: 'monthly',
      currentPeriodEnd: new Date('2026-05-30'),
    },
  })

  // Generate 132 trips across 12 months
  const trips = []
  const r = rng(42)
  let tripCount = 0
  const startDate = new Date('2025-05-01')

  for (let month = 0; month < 12; month++) {
    const tripsThisMonth = month === 11 ? 132 - tripCount : 10 + Math.floor(r() * 3) // 10-12 per month
    for (let t = 0; t < tripsThisMonth && tripCount < 132; t++) {
      const lane = pickItem(r, LANES)
      const day = 1 + Math.floor(r() * 27)
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + month)
      date.setDate(day)
      const milesVariance = 1 + (r() - 0.5) * 0.06
      const miles = Math.round(lane.miles * milesVariance)
      const dhMiles = Math.round(lane.dhMiles * milesVariance)
      const rpmBase = 2.55 + r() * 0.45 // $2.55–$3.00/mi
      const grossPay = Math.round(miles * rpmBase * 100) / 100
      trips.push({
        userId: user.id,
        date,
        origin: lane.origin,
        destination: lane.destination,
        miles,
        deadheadMiles: dhMiles,
        grossPay,
        broker: pickItem(r, BROKERS),
        staged: false,
      })
      tripCount++
    }
  }

  await prisma.trip.createMany({ data: trips })

  // Generate ~168 expenses
  const expenses = []
  const r2 = rng(99)
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(startDate)
    monthDate.setMonth(monthDate.getMonth() + month)

    for (const tmpl of EXPENSE_TEMPLATES) {
      const shouldAdd =
        tmpl.frequency === 'monthly' ? true :
        tmpl.frequency === 'biweekly' ? true :
        r2() < 0.55

      if (!shouldAdd) continue

      const date = new Date(monthDate)
      date.setDate(1 + Math.floor(r2() * 27))
      const amount = Math.round(rand(r2, tmpl.minAmount, tmpl.maxAmount) * 100) / 100
      expenses.push({ userId: user.id, date, category: tmpl.category, amount, description: null, staged: false })

      // Add second fuel for biweekly
      if (tmpl.frequency === 'biweekly' && tmpl.category === 'Fuel') {
        const date2 = new Date(monthDate)
        date2.setDate(15 + Math.floor(r2() * 13))
        const amount2 = Math.round(rand(r2, tmpl.minAmount, tmpl.maxAmount) * 100) / 100
        expenses.push({ userId: user.id, date: date2, category: 'Fuel', amount: amount2, description: null, staged: false })
      }
    }
  }

  await prisma.expense.createMany({ data: expenses })

  // Add 2 sample DataClarification threads
  const c1 = await prisma.dataClarification.create({
    data: {
      userId: user.id,
      sourceType: 'bank_import',
      status: 'pending',
      title: 'Categorize: PILOT FLYING J #0482 $892.14',
    },
  })
  await prisma.clarificationQuestion.create({
    data: {
      clarificationId: c1.id,
      order: 1,
      questionText: 'What type of expense was this Pilot Flying J transaction?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['Fuel', 'Maintenance', 'Food/Personal', 'Other']),
    },
  })

  const c2 = await prisma.dataClarification.create({
    data: {
      userId: user.id,
      sourceType: 'csv_import',
      status: 'pending',
      title: 'Missing broker on 3 imported trips',
    },
  })
  await prisma.clarificationQuestion.create({
    data: {
      clarificationId: c2.id,
      order: 1,
      questionText: 'These 3 trips have no broker listed. Do you want to assign a broker or leave it blank?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['Leave blank', 'Assign "Coyote Logistics"', 'Assign "CH Robinson"', 'Other (describe)']),
    },
  })

  const tripCount2 = await prisma.trip.count({ where: { userId: user.id } })
  const expCount = await prisma.expense.count({ where: { userId: user.id } })
  const revenue = await prisma.trip.aggregate({ where: { userId: user.id }, _sum: { grossPay: true } })
  console.log(`✓ Demo seeded: ${tripCount2} trips | ${expCount} expenses | $${revenue._sum.grossPay?.toFixed(0)} gross revenue`)
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1) })
