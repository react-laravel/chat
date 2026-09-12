'use client'

import { useEffect, useState } from 'react'
import ChatPage from '@/app/chat/page'
import ProtectedRoute from '@/components/ProtectedRoute'
import useChatStore from '@/app/chat/chatStore'
import { apiRequest, ApiError } from '@/lib/api'

export function EmbedClient({ clientId }: { clientId: string }) {
  return <ValidatedEmbed key={clientId} clientId={clientId} />
}

function ValidatedEmbed({ clientId }: { clientId: string }) {
  const [defaultRoom, setDefaultRoom] = useState<number | undefined>(undefined)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<'checking' | 'allowed' | 'denied' | 'unavailable'>('checking')

  useEffect(() => {
    let active = true
    const verify = async () => {
      if (!clientId || !document.referrer) return false
      const parentOrigin = new URL(document.referrer).origin
      const config = await apiRequest<{ default_room_id: number | null }>(
        `/embed/config?client=${encodeURIComponent(clientId)}&origin=${encodeURIComponent(parentOrigin)}`,
        'GET',
        undefined,
        { suppressUnauthorizedRedirect: true }
      )
      const requested = Number(new URLSearchParams(window.location.search).get('room'))
      if (active)
        setDefaultRoom(
          Number.isInteger(requested) && requested > 0
            ? requested
            : (config.default_room_id ?? undefined)
        )
      return true
    }
    void verify()
      .then(allowed => {
        if (active) setState(allowed ? 'allowed' : 'denied')
      })
      .catch(error => {
        if (active)
          setState(error instanceof ApiError && error.status === 403 ? 'denied' : 'unavailable')
      })
    return () => {
      active = false
    }
  }, [clientId, attempt])

  useEffect(() => {
    if (state !== 'allowed' || window.parent === window || !document.referrer) return
    const parentOrigin = new URL(document.referrer).origin
    const send = (type: string, extra: Record<string, unknown> = {}) =>
      window.parent.postMessage({ type, client: clientId, ...extra }, parentOrigin)
    const receive = (event: MessageEvent) => {
      if (
        event.source !== window.parent ||
        event.origin !== parentOrigin ||
        event.data?.client !== clientId
      )
        return
      if (event.data.type === 'dogeow-chat-visibility' && typeof event.data.visible === 'boolean') {
        document.documentElement.dataset.embedVisible = String(event.data.visible)
        document.dispatchEvent(new Event('chat:visibility'))
      }
    }
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !document.querySelector('[role="dialog"],[role="alertdialog"]')
      )
        send('dogeow-chat-close')
    }
    window.addEventListener('message', receive)
    document.addEventListener('keydown', escape)
    const unsubscribe = useChatStore.subscribe((next, previous) => {
      if (next.totalUnreadCount !== previous.totalUnreadCount)
        send('dogeow-chat-unread', { count: next.totalUnreadCount })
    })
    send('dogeow-chat-ready')
    send('dogeow-chat-unread', { count: useChatStore.getState().totalUnreadCount })
    return () => {
      unsubscribe()
      window.removeEventListener('message', receive)
      document.removeEventListener('keydown', escape)
    }
  }, [state, clientId])

  if (state === 'checking') {
    return <div className="flex min-h-dvh items-center justify-center">正在验证聊天接入方…</div>
  }

  if (state === 'unavailable')
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center text-sm">
        <p>聊天暂时不可用，请稍后重试。</p>
        <button
          type="button"
          className="rounded-lg border px-4 py-2"
          onClick={() => {
            setState('checking')
            setAttempt(value => value + 1)
          }}
        >
          重试
        </button>
      </div>
    )

  if (state === 'denied') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        当前网站尚未获准嵌入 DogeOW Chat。
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <ChatPage initialRoomId={defaultRoom} />
    </ProtectedRoute>
  )
}
