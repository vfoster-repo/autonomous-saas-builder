import type { DefaultSession, DefaultUser } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User extends DefaultUser {
    role: string
    onboardingCompleted: boolean
  }
  interface Session {
    user: {
      id: string
      role: string
      onboardingCompleted: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    onboardingCompleted: boolean
  }
}
