'use client'

import { useEffect } from 'react'
import useAuthStore from '@/stores/authStore'

export function AuthBootstrap() {
  const restoreSession = useAuthStore(state => state.restoreSession)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  return null
}
