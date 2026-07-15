'use client'

import { useEffect, useRef, useState } from 'react'
import useAuthStore from '@/stores/authStore'

interface SsoCallbackProps {
  ticket: string
  returnTo: string
  embedded: boolean
  clientId?: string
  parentOrigin?: string
}

export function SsoCallback({
  ticket,
  returnTo,
  embedded,
  clientId,
  parentOrigin,
}: SsoCallbackProps) {
  const exchangeTicket = useAuthStore(state => state.exchangeTicket)
  const started = useRef(false)
  const [error, setError] = useState<string | null>(ticket ? null : '缺少登录票据')

  useEffect(() => {
    if (!ticket || started.current) return
    started.current = true

    let context = embedded && clientId && parentOrigin ? { clientId, parentOrigin } : undefined
    if (!context && window.opener) {
      try {
        const openerUrl = new URL(window.opener.location.href)
        const openerClient = openerUrl.searchParams.get('client')
        const openerParentOrigin = new URL(window.opener.document.referrer).origin
        if (openerClient) context = { clientId: openerClient, parentOrigin: openerParentOrigin }
      } catch {
        context = undefined
      }
    }

    void exchangeTicket(ticket, context)
      .then(() => {
        if (context && window.opener) {
          window.opener.postMessage({ type: 'dogeow-chat-authenticated' }, window.location.origin)
          window.close()
          return
        }

        const target = new URL(returnTo, window.location.origin)
        window.location.replace(target.origin === window.location.origin ? target.href : '/chat')
      })
      .catch(reason => {
        setError(reason instanceof Error ? reason.message : '登录票据无效或已过期')
      })
  }, [clientId, embedded, exchangeTicket, parentOrigin, returnTo, ticket])

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="border-border bg-card w-full max-w-md rounded-xl border p-6 text-center shadow-lg">
        {error ? (
          <>
            <h1 className="text-xl font-semibold">无法完成登录</h1>
            <p className="text-muted-foreground mt-2 text-sm">{error}</p>
          </>
        ) : (
          <p>正在完成 DogeOW 统一登录…</p>
        )}
      </div>
    </main>
  )
}
