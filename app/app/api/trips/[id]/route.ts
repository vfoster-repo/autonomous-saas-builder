import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  date: z.string().optional(),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  miles: z.number().positive().optional(),
  deadheadMiles: z.number().min(0).optional(),
  grossPay: z.number().positive().optional(),
  broker: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
}).partial()

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'demo') return NextResponse.json({ error: 'Demo account is read-only' }, { status: 403 })
  const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const updated = await prisma.trip.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      ...(parsed.data.origin && { origin: parsed.data.origin }),
      ...(parsed.data.destination && { destination: parsed.data.destination }),
      ...(parsed.data.miles !== undefined && { miles: parsed.data.miles }),
      ...(parsed.data.deadheadMiles !== undefined && { deadheadMiles: parsed.data.deadheadMiles }),
      ...(parsed.data.grossPay !== undefined && { grossPay: parsed.data.grossPay }),
      ...(parsed.data.broker !== undefined && { broker: parsed.data.broker }),
      ...(parsed.data.customFields && { customFields: parsed.data.customFields as never }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'demo') return NextResponse.json({ error: 'Demo account is read-only' }, { status: 403 })
  const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.trip.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
