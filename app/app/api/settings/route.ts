import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  truckYear: z.string().optional(),
  truckMake: z.string().optional(),
  truckModel: z.string().optional(),
  truckVin: z.string().optional(),
  trailerType: z.string().optional(),
  avgMilesPerMonth: z.number().optional(),
  avgDeadheadPct: z.number().optional(),
  avgFuelCostPerGallon: z.number().optional(),
  avgMpg: z.number().optional(),
  truckPayment: z.number().optional(),
  trailerPayment: z.number().optional(),
  insurance: z.number().optional(),
  otherFixed: z.number().optional(),
  repairMaintenance: z.number().optional(),
  tires: z.number().optional(),
  tolls: z.number().optional(),
  permits: z.number().optional(),
  truckReservePerMile: z.number().optional(),
  trailerReservePerMile: z.number().optional(),
  federalBracket: z.string().optional(),
  federalCustomRate: z.number().optional(),
  stateRate: z.number().optional(),
  theme: z.string().optional(),
  expenseCategories: z.array(z.string()).optional(),
  widgetLayout: z.array(z.string()).optional(),
}).partial()

const onboardingSchema = z.object({
  operatorType: z.string(),
  onboardingCompleted: z.boolean().optional(),
}).merge(schema)

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json(settings)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'demo') return NextResponse.json({ error: 'Demo account is read-only' }, { status: 403 })

  const body = await req.json()
  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { operatorType, onboardingCompleted, ...settingsData } = parsed.data

  const updates: Record<string, unknown> = { ...settingsData }
  if (parsed.data.expenseCategories) updates.expenseCategories = parsed.data.expenseCategories
  if (parsed.data.widgetLayout) updates.widgetLayout = parsed.data.widgetLayout

  await prisma.$transaction(async (tx) => {
    await tx.userSettings.update({ where: { userId: session.user.id }, data: updates })
    if (operatorType !== undefined || onboardingCompleted !== undefined) {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          ...(operatorType !== undefined && { operatorType }),
          ...(onboardingCompleted !== undefined && { onboardingCompleted }),
        },
      })
    }
  })

  return NextResponse.json({ success: true })
}
