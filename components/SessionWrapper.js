'use client'
import { SessionProvider } from 'next-auth/react'
import RouteGuard from './RouteGuard'

export default function SessionWrapper({ children }) {
  return (
    <SessionProvider>
      <RouteGuard>{children}</RouteGuard>
    </SessionProvider>
  )
}
