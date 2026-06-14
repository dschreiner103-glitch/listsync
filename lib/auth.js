import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

// Google-Provider nur aktivieren, wenn die Keys gesetzt sind — sonst startet NextAuth nicht.
const providers = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email:    { label: 'Email',    type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
      })
      if (!user || !user.password) return null

      const valid = await compare(credentials.password, user.password)
      if (!valid) return null

      return { id: String(user.id), email: user.email, name: user.name }
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true,
  }))
}

export const authOptions = {
  providers,
  callbacks: {
    // Google-Login: User in DB anlegen, falls noch nicht vorhanden (Email gilt als verifiziert).
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        const email = user.email.toLowerCase()
        const existing = await prisma.user.findUnique({ where: { email } })
        if (!existing) {
          await prisma.user.create({
            data: { email, name: user.name || null, password: '' },
          })
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user?.id && account?.provider !== 'google') {
        token.id = user.id
      }
      // Bei Google (oder erstem JWT) die echte DB-id über die Email auflösen.
      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email.toLowerCase() } })
        if (dbUser) token.id = String(dbUser.id)
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
