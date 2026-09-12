'use client'

import { useEffect, useMemo, useRef } from 'react'
import useAuthStore from '@/stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function getEmbedContext() {
  if (typeof window === 'undefined' || window.parent === window) return undefined

  const clientId = new URLSearchParams(window.location.search).get('client')
  if (!clientId || !document.referrer) return undefined

  try {
    return { clientId, parentOrigin: new URL(document.referrer).origin }
  } catch {
    return undefined
  }
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, beginLogin, restoreSession } = useAuthStore()
  const redirected = useRef(false)
  const embedContext = useMemo(() => getEmbedContext(), [])

  useEffect(() => {
    const handleAuthenticated = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.type !== 'dogeow-chat-authenticated'
      ) {
        return
      }
      void restoreSession()
    }
    window.addEventListener('message', handleAuthenticated)
    return () => window.removeEventListener('message', handleAuthenticated)
  }, [restoreSession])

  useEffect(() => {
    if (!loading && !isAuthenticated && !embedContext && !redirected.current) {
      redirected.current = true
      beginLogin()
    }
  }, [beginLogin, embedContext, isAuthenticated, loading])

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center">正在恢复聊天会话…</div>
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div className="border-border bg-card w-full max-w-sm rounded-xl border p-6 text-center shadow-lg">
          <h1 className="text-2xl font-semibold">DogeOW Chat</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {embedContext ? '使用 DogeOW 账号继续聊天' : '正在前往 DogeOW 统一登录…'}
          </p>
          {embedContext ? (
            <button
              type="button"
              className="bg-primary text-primary-foreground mt-5 rounded-md px-5 py-2"
              onClick={() => beginLogin(embedContext)}
            >
              登录并继续
            </button>
          ) : null}
        </div>
      </main>
    )
  }

  return <>{children}</>
}
