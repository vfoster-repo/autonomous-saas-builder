import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Redirect to onboarding if not completed (skip for demo)
  if (!session.user.onboardingCompleted && session.user.role !== 'demo') {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar user={{ name: session.user.name, email: session.user.email, role: session.user.role }} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
