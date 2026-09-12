'use client'

import React, { useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/authStore'
import { format, isToday, isYesterday } from 'date-fns'

import { cn } from '@/lib/helpers'
import useChatStore from '@/app/chat/chatStore'
import { useRoomReadState } from '../hooks/useRoomReadState'
import { useMessageScroll } from '@/app/chat/hooks/message-list/useMessageScroll'
import type { ChatMessage } from '../types'
import { normalizeIncomingMessage } from '../utils/typeGuards'
import { messageText as plainMessageText } from '../utils/message-text'
import { MessageAttachments } from './MessageAttachments'
import { MessageInteractions } from './MessageInteractions'
import { MentionHighlight, useMentionDetection } from './MentionHighlight'
import { useTranslation } from '@/hooks/useTranslation'
import ChatErrorBoundary from './ChatErrorBoundary'

interface MessageListProps {
  roomId: number
  className?: string
  onReply?: (message: ChatMessage) => void
  searchQuery?: string
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

interface MessageGroupProps {
  messages: ChatMessage[]
  user: { id: number; name: string; email: string }
  timestamp: Date
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
  isTyping?: boolean
}

interface MessageItemProps {
  isOwn?: boolean
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
}

const EMPTY_MESSAGES: ChatMessage[] = []

const toRenderableMessage = (raw: ChatMessage): ChatMessage | null => {
  const message = normalizeIncomingMessage(raw)
  return message ? { ...message, message: plainMessageText(message.message) } : null
}

const MessageItem = React.memo(function MessageItem({
  message,
  onReply,
  onReact,
  isOwn,
}: MessageItemProps) {
  const mentionInfo = useMentionDetection(message.message)
  // ✅ 性能优化: 简化不必要的 useMemo，直接使用计算值
  const messageText = message.message.trim()
  const isImageUrl = /^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(messageText)

  return (
    <div
      className={cn(
        'group/message relative rounded-xl px-3 py-2 pr-10 transition-colors sm:pr-16',
        mentionInfo.hasCurrentUserMention
          ? 'bg-yellow-50 dark:bg-yellow-950/20'
          : isOwn
            ? 'bg-primary/10 hover:bg-primary/15'
            : 'bg-muted/40 hover:bg-muted/60'
      )}
    >
      {message.reply_to && (
        <div className="mb-2 rounded-md border-l-2 border-primary/50 bg-background/60 px-2.5 py-1.5 text-xs">
          <span className="font-medium">
            {message.reply_to.deleted ? '原消息已删除' : message.reply_to.user?.name}
          </span>
          {!message.reply_to.deleted && (
            <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-muted-foreground">
              {plainMessageText(
                message.reply_to.message || (message.reply_to.attachment_count ? '[附件]' : '')
              )}
            </p>
          )}
        </div>
      )}
      <div className="max-w-none text-sm leading-7 [overflow-wrap:anywhere]">
        {isImageUrl ? (
          <Image
            src={messageText}
            unoptimized
            alt="uploaded"
            width={960}
            height={720}
            sizes="(max-width: 768px) 100vw, 480px"
            className="max-h-72 w-auto max-w-full rounded-lg object-contain"
            loading="lazy"
            decoding="async"
            priority={false}
          />
        ) : (
          <MentionHighlight text={messageText} className="break-words whitespace-pre-wrap" />
        )}
      </div>
      <MessageAttachments attachments={message.attachments ?? []} />
      {message.edited_at && (
        <span
          className="mt-1 block text-[11px] text-muted-foreground"
          title={new Date(message.edited_at).toLocaleString()}
        >
          已编辑
        </span>
      )}
      <MessageInteractions message={message} onReply={onReply} onReact={onReact} />
    </div>
  )
})

const MessageGroup = React.memo(function MessageGroup({
  messages,
  user,
  timestamp,
  onReply,
  onReact,
  isTyping,
}: MessageGroupProps) {
  const { t } = useTranslation()
  const own = useAuthStore(state => state.user?.id === user.id)
  const formatTimestamp = useCallback(
    (date: Date) => {
      if (isToday(date)) return format(date, 'HH:mm')
      if (isYesterday(date)) return t('chat.yesterday', 'Yesterday')
      return format(date, 'MMM d')
    },
    [t]
  )

  return (
    <div
      className={cn('group relative w-fit max-w-[92%] sm:max-w-[85%]', own && 'ml-auto')}
      data-own={own}
    >
      <div className={cn('mb-1.5 flex min-w-0 items-center gap-2', own && 'flex-row-reverse')}>
        <div className="bg-primary/15 text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{user.name}</span>
          {isTyping ? (
            <span className="text-primary animate-pulse text-xs font-medium">正在输入中...</span>
          ) : (
            <span className="text-muted-foreground text-xs">{formatTimestamp(timestamp)}</span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        {messages.map(message => (
          <MessageItem
            key={message.id}
            isOwn={own}
            message={message}
            onReply={onReply}
            onReact={onReact}
          />
        ))}
      </div>
    </div>
  )
})

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-muted-foreground mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium">{t('chat.no_messages', 'No messages yet')}</h3>
      <p className="text-muted-foreground text-sm">
        {t('chat.be_first_to_start', 'Be the first to start the conversation!')}
      </p>
    </div>
  )
}

function MessageListContent({
  roomId,
  className,
  onReply,
  searchQuery,
  scrollContainerRef,
}: MessageListProps) {
  const { t } = useTranslation()
  const roomKey = useMemo(() => roomId.toString(), [roomId])
  const isLoading = useChatStore(state => state.loadingMessageRooms?.[roomKey] ?? false)
  const loadError = useChatStore(state => state.messageLoadErrors?.[roomKey])
  const pagination = useChatStore(state => state.messagesPagination?.[roomKey])
  const loadMoreMessages = useChatStore(state => state.loadMoreMessages)
  const loadMessages = useChatStore(state => state.loadMessages)
  const typingByRoom = useChatStore(state => state.typingByRoom)
  // ✅ 性能优化: 精细化选择器，只在当前房间的消息改变时重新渲染
  const messagesForRoom = useChatStore(
    useCallback(state => state.messages[roomKey] ?? EMPTY_MESSAGES, [roomKey])
  )

  const renderableMessages = useMemo(() => {
    const normalized = messagesForRoom
      .map(toRenderableMessage)
      .filter((message): message is ChatMessage => message !== null)

    if (process.env.NODE_ENV === 'development' && normalized.length !== messagesForRoom.length) {
      console.warn('MessageList: dropped malformed messages', {
        roomId,
        total: messagesForRoom.length,
        usable: normalized.length,
      })
    }

    return normalized
  }, [messagesForRoom, roomId])

  useRoomReadState(roomId, renderableMessages, scrollContainerRef)

  const hasSearchQuery = useMemo(() => !!searchQuery?.trim(), [searchQuery])

  const filteredMessages = useMemo(() => {
    if (!hasSearchQuery) return renderableMessages
    const query = searchQuery!.toLowerCase().trim()
    return renderableMessages.filter(
      m => m.message.toLowerCase().includes(query) || m.user.name.toLowerCase().includes(query)
    )
  }, [searchQuery, renderableMessages, hasSearchQuery])

  const stableLoadMessages = useCallback((id: number) => loadMessages(id), [loadMessages])

  const getScrollContainer = useCallback(() => {
    if (scrollContainerRef?.current) return scrollContainerRef.current
    return document.querySelector('.chat-messages-mobile') as HTMLDivElement | null
  }, [scrollContainerRef])

  // 分组，优化分组逻辑与类型推断
  const groupedMessages = useMemo(() => {
    if (!filteredMessages.length) return []
    const groups: {
      messages: ChatMessage[]
      user: { id: number; name: string; email: string }
      timestamp: Date
      isTyping: boolean
    }[] = []

    let curGroup: (typeof groups)[number] | null = null
    for (const m of filteredMessages) {
      const parsedDate = new Date(m.created_at)
      const curDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
      const isNewGroup =
        !curGroup ||
        curGroup.user.id !== m.user.id ||
        Math.abs(curDate.getTime() - curGroup.timestamp.getTime()) > 5 * 60 * 1000

      if (isNewGroup) {
        const typingInfo = typingByRoom[roomKey]
        curGroup = {
          messages: [m],
          user: m.user,
          timestamp: curDate,
          isTyping: typingInfo?.userId === m.user.id,
        }
        groups.push(curGroup)
      } else if (curGroup) {
        curGroup.messages.push(m)
      }
    }
    return groups
  }, [filteredMessages, typingByRoom, roomKey])

  useEffect(() => {
    if (roomId) {
      stableLoadMessages(roomId).catch(error => {
        let errMsg: string
        if (error instanceof Error) errMsg = error.message
        else if (error && typeof error === 'object') {
          const errObj = error as Record<string, unknown>
          errMsg = JSON.stringify({
            type: typeof error,
            message: (typeof errObj.message === 'string' && errObj.message) || 'Unknown error',
            status: errObj.status ?? 'No status',
            code: errObj.code ?? 'No code',
          })
        } else errMsg = String(error)
        console.error('Failed to load messages:', errMsg)
      })
    }
  }, [roomId, stableLoadMessages])

  useMessageScroll({
    roomId,
    messageCount: filteredMessages.length,
    firstMessageId: filteredMessages[0]?.id,
    hasSearchQuery,
    getScrollContainer,
  })

  if (filteredMessages.length === 0 && !isLoading && !loadError) {
    return (
      <div className={cn('mx-auto w-full max-w-4xl px-4 py-5 sm:px-6', className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div
      className={cn('mx-auto w-full max-w-4xl px-4 py-5 sm:px-6', className)}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-busy={isLoading}
    >
      {loadError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm"
        >
          <span>{loadError.message}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadMessages(roomId, loadError.page)}
          >
            重试
          </Button>
        </div>
      )}
      {pagination?.has_more && (
        <div className="mb-5 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadMoreMessages(roomId)}
          >
            {t('chat.load_earlier', '加载更早的消息')}
          </Button>
        </div>
      )}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('chat.loading_messages', 'Loading more messages...')}
          </div>
        </div>
      )}
      <div className="space-y-4">
        {groupedMessages.map((group, idx) => (
          <MessageGroup
            key={`group-${group.user.id}-${group.timestamp.getTime()}-${idx}`}
            messages={group.messages}
            user={group.user}
            timestamp={group.timestamp}
            onReply={onReply}
            isTyping={group.isTyping}
          />
        ))}
      </div>
    </div>
  )
}

export function MessageList({
  roomId,
  className,
  onReply,
  searchQuery,
  scrollContainerRef,
}: MessageListProps) {
  return (
    <ChatErrorBoundary>
      <MessageListContent
        roomId={roomId}
        className={className}
        onReply={onReply}
        searchQuery={searchQuery}
        scrollContainerRef={scrollContainerRef}
      />
    </ChatErrorBoundary>
  )
}
