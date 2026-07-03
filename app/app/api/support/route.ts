import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ subject: z.string().min(1).max(200), message: z.string().min(1).max(5000) })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  await prisma.supportTicket.create({ data: { userId: session.user.id, subject: parsed.data.subject, message: parsed.data.message } })
  return NextResponse.json({ success: true }, { status: 201 })
}
