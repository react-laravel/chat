'use client'

import { useEffect, useState } from 'react'
import ChatPage from '@/app/chat/page'
import ProtectedRoute from '@/components/ProtectedRoute'
import { apiRequest } from '@/lib/api'

export function EmbedClient({ clientId }: { clientId: string }) {
  return <ValidatedEmbed key={clientId} clientId={clientId} />
}

function ValidatedEmbed({ clientId }: { clientId: string }) {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    let active = true
    const verify = async () => {
      if (!clientId || !document.referrer) return false
      const parentOrigin = new URL(document.referrer).origin
      await apiRequest(
        `/embed/config?client=${encodeURIComponent(clientId)}&origin=${encodeURIComponent(parentOrigin)}`,
        'GET',
        undefined,
        { suppressUnauthorizedRedirect: true }
      )
      return true
    }
    void verify()
      .then(allowed => {
        if (active) setState(allowed ? 'allowed' : 'denied')
      })
      .catch(() => {
        if (active) setState('denied')
      })
    return () => {
      active = false
    }
  }, [clientId])

  if (state === 'checking') {
    return <div className="flex min-h-dvh items-center justify-center">正在验证聊天接入方…</div>
  }

  if (state === 'denied') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        当前网站尚未获准嵌入 DogeOW Chat。
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  )
}
