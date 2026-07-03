import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  date: z.string().optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
}).partial()

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'demo') return NextResponse.json({ error: 'Demo account is read-only' }, { status: 403 })
  const expense = await prisma.expense.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      ...(parsed.data.category && { category: parsed.data.category }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.customFields && { customFields: parsed.data.customFields as never }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'demo') return NextResponse.json({ error: 'Demo account is read-only' }, { status: 403 })
  const expense = await prisma.expense.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.expense.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
