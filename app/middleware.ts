export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/trips/:path*',
    '/expenses/:path*',
    '/reports/:path*',
    '/calculator/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/account/:path*',
    '/support/:path*',
    '/clarifications/:path*',
    '/import/:path*',
  ],
}
