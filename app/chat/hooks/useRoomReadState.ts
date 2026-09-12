import { useEffect, useRef, useState } from 'react'
import { put } from '@/lib/api'
import useAuthStore from '@/stores/authStore'
import useChatStore from '../chatStore'
import type { ChatMessage } from '../types'
import { useScrollPosition } from '../components/UnreadMessageIndicator'

export function useRoomReadState(
  roomId: number,
  messages: ChatMessage[],
  containerRef?: React.RefObject<HTMLDivElement | null>
) {
  const { isAtBottom } = useScrollPosition(containerRef ?? { current: null })
  const userId = useAuthStore(state => state.user?.id)
  const connected = useChatStore(state => state.isConnected)
  const serverRead = useChatStore(
    state => state.rooms?.find(room => room.id === roomId)?.last_read_message_id ?? 0
  )
  const [visible, setVisible] = useState(false)
  const acknowledged = useRef<Record<string, number>>({})
  const latest = messages.reduce((max, message) => Math.max(max, message.id), 0)
  useEffect(() => {
    const update = () =>
      setVisible(
        document.visibilityState === 'visible' &&
          (window.parent === window || document.documentElement.dataset.embedVisible === 'true')
      )
    update()
    document.addEventListener('visibilitychange', update)
    document.addEventListener('chat:visibility', update)
    return () => {
      document.removeEventListener('visibilitychange', update)
      document.removeEventListener('chat:visibility', update)
    }
  }, [])
  useEffect(() => {
    const key = `${userId}:${roomId}`
    if (
      !userId ||
      !connected ||
      !visible ||
      !isAtBottom ||
      !latest ||
      latest <= Math.max(serverRead, acknowledged.current[key] ?? 0)
    )
      return
    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout>
    const sync = async () => {
      try {
        const state = await put<{ last_read_message_id: number; unread_count: number }>(
          `/chat/rooms/${roomId}/read`,
          { message_id: latest }
        )
        if (cancelled || useAuthStore.getState().user?.id !== userId) return
        acknowledged.current[key] = state.last_read_message_id
        useChatStore
          .getState()
          .applyReadState(roomId, state.last_read_message_id, state.unread_count)
      } catch {
        if (!cancelled && ++attempts < 3) timer = setTimeout(sync, 5000)
      }
    }
    timer = setTimeout(sync, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [userId, roomId, connected, visible, isAtBottom, latest, serverRead])
}
