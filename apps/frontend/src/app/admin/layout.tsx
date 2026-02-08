'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { useAuth } from '@/lib/hooks'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading, refreshUser } = useAuth()
  const [hasChecked, setHasChecked] = useState(false)
  const hasRefreshed = useRef(false)

  // Refresh user data once on mount (only if we have a token)
  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true
      refreshUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Wait until we have definitive auth state
    if (isLoading) return

    // First time check - redirect if not authenticated
    if (!hasChecked) {
      setHasChecked(true)
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }
    }
  }, [isLoading, isAuthenticated, hasChecked, router])

  useEffect(() => {
    // Redirect non-admins away from admin panel (only once authenticated)
    if (isAuthenticated && !isAdmin && hasChecked) {
      router.replace('/dashboard')
      return
    }
  }, [isAuthenticated, isAdmin, hasChecked, router])

  // Don't render while loading, if not authenticated, not admin, or redirecting
  if (isLoading || !isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar variant="admin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background-dark">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
