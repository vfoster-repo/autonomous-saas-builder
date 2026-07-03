import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  date: z.string(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  miles: z.number().positive(),
  deadheadMiles: z.number().min(0).optional(),
  grossPay: z.number().positive(),
  broker: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trip.count({ where: { userId: session.user.id } }),
  ])
  return NextResponse.json({ trips, total, page, limit })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'demo') return NextResponse.json({ error: 'Demo account is read-only' }, { status: 403 })
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
  const trip = await prisma.trip.create({
    data: {
      userId: session.user.id,
      date: new Date(parsed.data.date),
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      miles: parsed.data.miles,
      deadheadMiles: parsed.data.deadheadMiles ?? 0,
      grossPay: parsed.data.grossPay,
      broker: parsed.data.broker,
      customFields: (parsed.data.customFields ?? {}) as never,
    },
  })
  return NextResponse.json(trip, { status: 201 })
}
