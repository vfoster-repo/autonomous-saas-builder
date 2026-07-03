'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/trips', label: 'Trips', icon: '🚛' },
  { href: '/expenses', label: 'Expenses', icon: '💰' },
  { href: '/reports', label: 'Reports', icon: '📊' },
  { href: '/calculator', label: 'Calculator', icon: '🧮' },
  { href: '/clarifications', label: 'Inbox', icon: '📬' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
      <div className="px-4 py-5 border-b border-gray-800">
        <span className="text-lg font-bold text-white">TruckerFlow</span>
        {user.role === 'demo' && (
          <span className="ml-2 text-xs bg-yellow-600/30 text-yellow-400 px-1.5 py-0.5 rounded">DEMO</span>
        )}
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 mb-3 truncate">{user.email}</div>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-sm text-gray-400 hover:text-red-400 transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  )
}
