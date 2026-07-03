'use client'
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/truckerflow-v7/api/auth">{children}</SessionProvider>
}
