'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks'
import { type ReactNode } from 'react'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, refreshUser } = useAuth()
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Only refresh user data once on app initialization
    // and only if we have a token (user was previously logged in)
    if (!hasInitialized.current && isAuthenticated) {
      refreshUser()
      hasInitialized.current = true
    }
  }, [isAuthenticated, refreshUser])

  return <>{children}</>
}
