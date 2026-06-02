export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/((?!$|login|register|pricing|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
