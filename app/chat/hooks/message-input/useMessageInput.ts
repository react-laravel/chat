import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { useTranslation } from '@/hooks/useTranslation'
import useAuthStore from '@/stores/authStore'
import useChatStore from '@/app/chat/chatStore'
import {
  MAX_MESSAGE_LENGTH,
  MAX_TEXTAREA_HEIGHT,
  TYPING_TIMEOUT,
} from '@/app/chat/utils/message-input/constants'
import { getDraftKey } from '@/app/chat/utils/message-input/utils'
import type { MessageInputProps } from '@/app/chat/types/messageInput'

function readDraft(roomId: number, userId?: number): string {
  try {
    return window.localStorage.getItem(getDraftKey(roomId, userId)) ?? ''
  } catch {
    return ''
  }
}

function saveDraft(roomId: number, message: string, userId?: number) {
  try {
    if (message.trim()) window.localStorage.setItem(getDraftKey(roomId, userId), message)
    else window.localStorage.removeItem(getDraftKey(roomId, userId))
  } catch {
    // Drafts remain editable when browser storage is unavailable.
  }
}

export function useMessageInput({
  roomId,
  sendMessage,
  isConnected,
  replyingTo,
  onCancelReply,
  onTypingStart,
  onTypingStop,
  attachmentIds = [],
  attachmentsBusy = false,
  onAttachmentsSent,
}: Pick<
  MessageInputProps,
  | 'roomId'
  | 'sendMessage'
  | 'isConnected'
  | 'replyingTo'
  | 'onCancelReply'
  | 'onTypingStart'
  | 'onTypingStop'
  | 'attachmentIds'
  | 'attachmentsBusy'
  | 'onAttachmentsSent'
>) {
  const { t } = useTranslation()
  const userId = useAuthStore(state => state.user?.id)
  const { checkMuteStatus, muteUntil } = useChatStore()
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [sendingRooms, setSendingRooms] = useState<number[]>([])
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const pendingRooms = useRef(new Set<number>())
  const draftValues = useRef<Record<number, string>>({})
  const activeRoom = useRef(roomId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const message = drafts[roomId] ?? ''
  const isSending = sendingRooms.includes(roomId)

  const setMessage = useCallback(
    (value: string) => {
      draftValues.current[roomId] = value
      setDrafts(previous => ({ ...previous, [roomId]: value }))
      saveDraft(roomId, value, userId)
    },
    [roomId, userId]
  )

  useEffect(() => {
    activeRoom.current = roomId
    const saved = draftValues.current[roomId] ?? readDraft(roomId, userId)
    draftValues.current[roomId] = saved
    setDrafts(previous => ({ ...previous, [roomId]: saved }))
    setIsEmojiPickerOpen(false)
  }, [roomId, userId])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
      onTypingStop?.()
    }
  }, [onTypingStop])

  useEffect(() => () => stopTyping(), [roomId, stopTyping])

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [])

  useEffect(adjustTextareaHeight, [message, adjustTextareaHeight])

  const handleInputChange = useCallback(
    (value: string) => {
      if (value.length > MAX_MESSAGE_LENGTH) return
      setMessage(value)
      if (!isConnected || checkMuteStatus()) return
      onTypingStart?.()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null
        onTypingStop?.()
      }, TYPING_TIMEOUT)
    },
    [setMessage, isConnected, checkMuteStatus, onTypingStart, onTypingStop]
  )

  const insertEmoji = useCallback(
    (emoji: string) => {
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const next = message.slice(0, start) + emoji + message.slice(textarea.selectionEnd)
      if (next.length > MAX_MESSAGE_LENGTH) return
      setMessage(next)
      setIsEmojiPickerOpen(false)
      requestAnimationFrame(() => {
        if (activeRoom.current !== roomId) return
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      })
    },
    [message, setMessage, roomId]
  )

  const replyTarget =
    replyingTo?.room_id == null || replyingTo.room_id === roomId ? replyingTo : null
  const messageToSend = message.trim()

  const canSend =
    (Boolean(message.trim()) || attachmentIds.length > 0) &&
    attachmentIds.length <= 5 &&
    !attachmentsBusy &&
    messageToSend.length <= MAX_MESSAGE_LENGTH &&
    !isSending &&
    isConnected &&
    !checkMuteStatus()

  const handleSendMessage = useCallback(async () => {
    // A synchronous lock also covers two events before React's next render.
    if (pendingRooms.current.has(roomId)) return
    if (checkMuteStatus()) {
      toast.error(
        muteUntil
          ? `您在此房间被静音直到 ${new Date(muteUntil).toLocaleString()}`
          : '您在此房间被静音'
      )
      return
    }
    if (attachmentsBusy || attachmentIds.length > 5) return
    if (!message.trim() && !attachmentIds.length) {
      toast.error(t('chat.message_cannot_be_empty', 'Message cannot be empty'))
      return
    }
    if (messageToSend.length > MAX_MESSAGE_LENGTH) {
      toast.error(
        t('chat.message_too_long', 'Message cannot exceed {count} characters').replace(
          '{count}',
          String(MAX_MESSAGE_LENGTH)
        )
      )
      return
    }
    if (!isConnected) {
      toast.error(t('chat.not_connected', 'Not connected to chat server'))
      return
    }

    pendingRooms.current.add(roomId)
    setSendingRooms([...pendingRooms.current])
    stopTyping()
    try {
      const result = attachmentIds.length
        ? await sendMessage(String(roomId), messageToSend, replyTarget?.id, attachmentIds)
        : replyTarget
          ? await sendMessage(String(roomId), messageToSend, replyTarget.id)
          : await sendMessage(String(roomId), messageToSend)
      if (!result.success) {
        toast.error(result.errorMessage ?? t('chat.failed_to_send', 'Failed to send message'))
        return
      }
      onAttachmentsSent?.(attachmentIds)
      // A response belongs to the room/draft that initiated it, even after navigation.
      if (draftValues.current[roomId] === message) {
        draftValues.current[roomId] = ''
        setDrafts(previous => ({ ...previous, [roomId]: '' }))
        saveDraft(roomId, '', userId)
      }
      if (activeRoom.current === roomId) {
        onCancelReply?.()
        requestAnimationFrame(() => {
          if (activeRoom.current === roomId) textareaRef.current?.focus()
        })
      }
    } catch {
      toast.error(t('chat.failed_to_send', 'Failed to send message'))
    } finally {
      pendingRooms.current.delete(roomId)
      setSendingRooms([...pendingRooms.current])
    }
  }, [
    roomId,
    userId,
    checkMuteStatus,
    muteUntil,
    message,
    messageToSend,
    replyTarget,
    attachmentIds,
    attachmentsBusy,
    onAttachmentsSent,
    isConnected,
    t,
    stopTyping,
    sendMessage,
    onCancelReply,
  ])

  useEffect(() => {
    if (replyingTo?.room_id === roomId) textareaRef.current?.focus()
  }, [replyingTo, roomId])

  return {
    message,
    characterCount: messageToSend.length,
    setMessage,
    isSending,
    isEmojiPickerOpen,
    setIsEmojiPickerOpen,
    textareaRef,
    fileInputRef,
    canSend,
    handleInputChange,
    insertEmoji,
    handleSendMessage,
    adjustTextareaHeight,
  }
}
