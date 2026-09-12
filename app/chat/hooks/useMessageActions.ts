import { useCallback, useRef, useState } from 'react'
import useAuthStore from '@/stores/authStore'
import { del, patch, put } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import useChatStore from '../chatStore'
import type { ChatMessage } from '../types'
import { normalizeIncomingMessage } from '../utils/typeGuards'

export function useMessageActions(message: ChatMessage) {
  const actorId = useAuthStore(state => state.user?.id)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const perform = useCallback(async (action: () => Promise<void>) => {
    if (pending.current) return false
    pending.current = true
    setBusy(true)
    try {
      await action()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败，请重试')
      return false
    } finally {
      pending.current = false
      setBusy(false)
    }
  }, [])
  const endpoint = `/chat/rooms/${message.room_id}/messages/${message.id}`
  const applyResponse = (response: unknown) => {
    if (useAuthStore.getState().user?.id !== actorId) return
    const updated = normalizeIncomingMessage(response)
    if (!updated) throw new Error('未能确认消息更新，请刷新后重试')
    useChatStore.getState().updateMessage(updated)
  }

  return {
    busy,
    edit: (content: string) =>
      perform(async () => {
        applyResponse(await patch(endpoint, { message: content }))
      }),
    remove: () =>
      perform(async () => {
        await del(endpoint)
        if (useAuthStore.getState().user?.id === actorId)
          useChatStore.getState().removeMessage(message.room_id, message.id)
      }),
    react: (emoji: string, remove: boolean) =>
      perform(async () => {
        applyResponse(await (remove ? del : put)(`${endpoint}/reactions`, { emoji }))
      }),
  }
}
