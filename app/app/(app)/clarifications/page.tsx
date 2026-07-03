import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ClarificationsPage() {
  const session = await auth()
  const items = await prisma.dataClarification.findMany({
    where: { userId: session!.user.id },
    include: { questions: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">Clarification Inbox</h1>
      <p className="text-gray-400 text-sm">Questions about your imported data</p>

      {items.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">No pending clarifications</div>
      ) : (
        items.map(c => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white font-medium text-sm">{c.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{c.sourceType} · {new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-green-900/50 text-green-300'}`}>{c.status}</span>
            </div>
            {c.questions.map(q => (
              <div key={q.id} className="bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-200 mb-2">{q.questionText}</div>
                {q.answer ? (
                  <div className="text-xs text-green-400">✓ {q.answer}</div>
                ) : (
                  <div className="text-xs text-yellow-400">Awaiting answer</div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
