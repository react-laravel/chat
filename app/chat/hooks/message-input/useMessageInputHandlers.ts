import { useCallback, useEffect } from 'react'
import type React from 'react'
import type { ChatMessage } from '@/app/chat/types'
import type { MentionSuggestion } from '@/app/chat/types/messageInput'

interface UseMessageInputHandlersParams {
  roomId: number
  message: string
  handleInputChange: (value: string) => void
  setMessage: (value: string) => void
  replyTarget: ChatMessage | null
  onCancelReply?: () => void
  mentionSuggestions: MentionSuggestion[]
  selectedMentionIndex: number
  showMentions: boolean
  checkForMentions: (text: string, cursorPos: number) => void
  insertMention: (
    suggestion: MentionSuggestion,
    message: string,
    setMessage: (msg: string) => void
  ) => { newMessage: string; newCursorPos: number } | void
  handleMentionNavigation: (key: string) => boolean
  handleSendMessage: () => void
  sendMessage: (
    roomId: string,
    message: string
  ) => Promise<{ success: true } | { success: false; errorMessage?: string }>
  isConnected: boolean
  checkMuteStatus: () => boolean
  muteUntil: string | null
  t: (key: string, fallback?: string) => string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  inputContainerRef: React.RefObject<HTMLDivElement | null>
  onImageUploadSuccess?: () => void
}

/**
 * 抽离 MessageInput 中的交互处理逻辑，提升可读性与复用性
 */
export function useMessageInputHandlers({
  roomId,
  message,
  handleInputChange,
  setMessage,
  replyTarget,
  onCancelReply,
  mentionSuggestions,
  selectedMentionIndex,
  showMentions,
  checkForMentions,
  insertMention,
  handleMentionNavigation,
  handleSendMessage,
  sendMessage,
  isConnected,
  checkMuteStatus,
  muteUntil,
  t,
  fileInputRef,
  textareaRef,
  scrollContainerRef,
  inputContainerRef,
  onImageUploadSuccess,
}: UseMessageInputHandlersParams) {
  // 处理消息输入变化
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      const cursorPosition = e.target.selectionStart

      handleInputChange(value)
      checkForMentions(value, cursorPosition)
    },
    [handleInputChange, checkForMentions]
  )

  // 处理提及选择
  const handleMentionSelect = useCallback(
    (suggestion: MentionSuggestion) => {
      const result = insertMention(suggestion, message, setMessage)
      if (result && textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus()
          textareaRef.current?.setSelectionRange(result.newCursorPos, result.newCursorPos)
        }, 0)
      }
    },
    [insertMention, message, setMessage, textareaRef]
  )

  // 处理键盘快捷键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent?.isComposing || e.nativeEvent?.keyCode === 229) return

      // 处理@提及导航
      if (handleMentionNavigation(e.key)) {
        e.preventDefault()
        return
      }

      // 如果有提及建议且按下Enter或Tab
      if (showMentions && mentionSuggestions.length > 0 && (e.key === 'Enter' || e.key === 'Tab')) {
        e.preventDefault()
        handleMentionSelect(mentionSuggestions[selectedMentionIndex])
        return
      }

      // 按Enter发送消息（不按Shift）
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }

      // 按Escape取消回复
      if (e.key === 'Escape' && replyTarget && onCancelReply) {
        e.preventDefault()
        onCancelReply()
      }
    },
    [
      handleMentionNavigation,
      showMentions,
      mentionSuggestions,
      selectedMentionIndex,
      handleMentionSelect,
      handleSendMessage,
      replyTarget,
      onCancelReply,
    ]
  )

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [scrollContainerRef])

  useEffect(() => {
    const container = inputContainerRef.current
    if (!container || typeof window === 'undefined') return

    const updateHeight = () => {
      const height = container.offsetHeight
      document.documentElement.style.setProperty('--chat-input-height', `${height}px`)
    }

    updateHeight()

    let observer: ResizeObserver | null = null
    const canConstructResizeObserver =
      typeof ResizeObserver === 'function' &&
      typeof ResizeObserver.prototype?.observe === 'function'

    if (canConstructResizeObserver) {
      try {
        observer = new ResizeObserver(() => {
          updateHeight()
        })
        observer.observe(container)
      } catch {
        // Ignore and keep static height when observer cannot be initialized.
      }
    }

    return () => {
      observer?.disconnect()
    }
  }, [inputContainerRef])

  return {
    handleTextareaChange,
    handleMentionSelect,
    handleKeyDown,
    scrollToBottom,
  }
}
