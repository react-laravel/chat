'use client'

import { useEffect, useState } from 'react'
import ChatPage from '@/app/chat/page'
import ProtectedRoute from '@/components/ProtectedRoute'
import { apiRequest } from '@/lib/api'

export function EmbedClient({ clientId }: { clientId: string }) {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    if (!clientId || !document.referrer) {
      setState('denied')
      return
    }

    let parentOrigin = ''
    try {
      parentOrigin = new URL(document.referrer).origin
    } catch {
      setState('denied')
      return
    }

    void apiRequest(
      `/embed/config?client=${encodeURIComponent(clientId)}&origin=${encodeURIComponent(parentOrigin)}`,
      'GET',
      undefined,
      { suppressUnauthorizedRedirect: true }
    )
      .then(() => setState('allowed'))
      .catch(() => setState('denied'))
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
