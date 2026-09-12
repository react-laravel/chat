'use client'

// 2025-09-24 claude-4-sonnet 优化过本文件代码：「优化代码」

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  MessageList,
  MessageInput,
  ChatHeader,
  ChatSidebar,
  MobileSheets,
  ChatErrorHandler,
  ChatWelcome,
  ChatPageSkeleton,
} from './components'
import ChatErrorBoundary, { useChatErrorHandler } from './components/ChatErrorBoundary'
import { useChatUIStore } from './stores/uiStore'
import { useShallow } from 'zustand/react/shallow'
import useChatStore from '@/app/chat/chatStore'
import useAuthStore from '@/stores/authStore'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import type { ChatMessage, MessageData } from './types'
import { normalizeIncomingMessage } from './utils/typeGuards'
import './styles/chat-mobile.css'

// 通用空函数
const noop = () => {}

// 节流时间常量
const LOAD_THROTTLE_TIME = 5000

function ChatPageContent() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, token } = useAuthStore()
  const {
    currentRoom,
    rooms,
    retryLastAction,
    clearError,
    error: storeError,
    clearAllOnlineUsers,
    setConnectionStatus,
    addMessage,
    updateMuteStatus,
    updateRoomOnlineCount,
    setTyping,
  } = useChatStore(
    useShallow(s => ({
      currentRoom: s.currentRoom,
      rooms: s.rooms,
      retryLastAction: s.retryLastAction,
      clearError: s.clearError,
      error: s.error,
      clearAllOnlineUsers: s.clearAllOnlineUsers,
      setConnectionStatus: s.setConnectionStatus,
      addMessage: s.addMessage,
      updateMuteStatus: s.updateMuteStatus,
      updateRoomOnlineCount: s.updateRoomOnlineCount,
      setTyping: s.setTyping,
    }))
  )

  // Refs 优化
  const hasLoadedInitialDataRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadThrottleTimersRef = useRef<Record<string, number>>({})

  // 移动端状态
  const { isRoomListOpen, isUsersListOpen, setRoomListOpen, setUsersListOpen } = useChatUIStore()
  const [joinedRoomId, setJoinedRoomId] = useState<number | null>(null)
  const [joinAttempt, setJoinAttempt] = useState(0)
  const [joinFailure, setJoinFailure] = useState<{ roomId: number; message: string } | null>(null)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)

  // 错误处理
  const {
    error: componentError,
    handleError,
    clearError: clearComponentError,
    retryAction,
  } = useChatErrorHandler()

  // 缓存的函数 - 优化防重复加载逻辑
  const loadRooms = useCallback(() => useChatStore.getState().loadRooms(), [])

  const loadOnlineUsersThrottled = useCallback((roomId: number) => {
    const now = Date.now()
    const lastLoadKey = `room_${roomId}_last_load`
    const lastLoadTime = loadThrottleTimersRef.current[lastLoadKey] ?? 0

    if (now - lastLoadTime < LOAD_THROTTLE_TIME) {
      return Promise.resolve()
    }

    loadThrottleTimersRef.current[lastLoadKey] = now
    return useChatStore.getState().loadOnlineUsers(roomId)
  }, [])

  // WebSocket事件处理 - 使用 useMemo 优化
  const webSocketHandlers = useMemo(
    () => ({
      handleConnect: () => setConnectionStatus('connected'),

      handleDisconnect: () => {
        setConnectionStatus('disconnected')
        setJoinedRoomId(null)
        clearAllOnlineUsers()
      },

      handleWebSocketError: () => {
        setConnectionStatus('disconnected')
        setJoinedRoomId(null)
        clearAllOnlineUsers()
      },

      handleTyping: (roomId: string, data: { id: number; name: string }) => {
        setTyping(Number(roomId), data.id, data.name || '')
      },

      handleMessage: (data: unknown) => {
        const messageData = data as MessageData
        const currentUserId = useAuthStore.getState().user?.id

        switch (messageData.type) {
          case 'user_muted':
          case 'user_unmuted': {
            if (messageData.user_id === currentUserId) {
              updateMuteStatus(
                messageData.type === 'user_muted',
                messageData.muted_until,
                messageData.reason
              )
            }
            break
          }

          case 'user.joined.room':
          case 'user.left.room': {
            if (messageData.room_id && messageData.online_count !== undefined) {
              updateRoomOnlineCount(messageData.room_id, messageData.online_count)
            }
            break
          }

          case 'message': {
            if (messageData.message) {
              const normalizedMessage = normalizeIncomingMessage(messageData.message)
              if (normalizedMessage) {
                addMessage(normalizedMessage.room_id, normalizedMessage)
              } else {
                console.warn('ChatPage: ignored malformed realtime message payload', messageData)
              }
            }
            break
          }

          case 'user_joined':
          case 'user_left': {
            const activeRoom = useChatStore.getState().currentRoom
            if (activeRoom) {
              loadOnlineUsersThrottled(activeRoom.id).catch(noop)
            }
            break
          }

          default:
            break
        }
      },
    }),
    [
      setConnectionStatus,
      clearAllOnlineUsers,
      setTyping,
      updateMuteStatus,
      updateRoomOnlineCount,
      addMessage,
      loadOnlineUsersThrottled,
    ]
  )

  // 移动端处理函数 - 使用 useMemo 优化
  const mobileHandlers = useMemo(
    () => ({
      handleOpenRoomList: () => setRoomListOpen(true),
      handleOpenUsersList: () => setUsersListOpen(true),
      handleReply: (message: ChatMessage) => setReplyingTo(message),
      cancelReply: () =>
        setReplyingTo(reply => (reply?.room_id === currentRoom?.id ? null : reply)),
    }),
    [setRoomListOpen, setUsersListOpen, currentRoom?.id]
  )

  // 消息发送成功处理
  const handleMessageSentSuccess = useCallback(
    (messageData: unknown) => {
      const normalizedMessage = normalizeIncomingMessage(messageData)
      if (normalizedMessage) {
        addMessage(normalizedMessage.room_id, normalizedMessage)
      } else {
        console.warn('ChatPage: ignored malformed sendMessage response payload', messageData)
      }
    },
    [addMessage]
  )

  // 认证令牌刷新回调
  const authTokenRefreshCallback = useCallback(() => Promise.resolve(token || null), [token])

  // WebSocket连接配置 - 使用 useMemo 优化
  const webSocketConfig = useMemo(
    () => ({
      autoConnect: false,
      onConnect: webSocketHandlers.handleConnect,
      onDisconnect: webSocketHandlers.handleDisconnect,
      onError: webSocketHandlers.handleWebSocketError,
      onMessage: webSocketHandlers.handleMessage,
      onTyping: webSocketHandlers.handleTyping,
      onOffline: noop,
      onOnline: noop,
      onMessageQueued: noop,
      onMessageSent: noop,
      onMessageFailed: noop,
      onMessageSentSuccess: handleMessageSentSuccess,
      authTokenRefreshCallback,
    }),
    [webSocketHandlers, handleMessageSentSuccess, authTokenRefreshCallback]
  )

  // WebSocket连接
  const {
    connect,
    joinRoom: wsJoinRoom,
    sendMessage,
    sendTyping,
    connectionInfo,
    offlineState,
    reconnect,
    retryFailedMessages,
    clearOfflineQueue,
  } = useChatWebSocket(webSocketConfig)

  // 鉴权检查
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  // 禁用主容器滚动，让聊天区域独立处理滚动
  useEffect(() => {
    const mainContainer = document.getElementById('main-container')
    if (!mainContainer) return

    const previousOverflowY = mainContainer.style.overflowY

    // 禁用主容器的垂直滚动
    mainContainer.style.overflowY = 'hidden'

    return () => {
      // 离开页面时恢复
      mainContainer.style.overflowY = previousOverflowY
    }
  }, [])

  // 初始化聊天 - 优化错误处理
  useEffect(() => {
    if (!isAuthenticated || authLoading || hasLoadedInitialDataRef.current) return

    hasLoadedInitialDataRef.current = true

    const initializeChat = async () => {
      try {
        clearAllOnlineUsers()
        await loadRooms()

        // WebSocket连接失败不阻断初始化流程
        connect().catch(noop)
      } catch (error) {
        console.error('Chat initialization failed:', error)
        handleError(error as Error)
      }
    }

    initializeChat()
  }, [isAuthenticated, authLoading, connect, loadRooms, handleError, clearAllOnlineUsers])

  // Restore server presence before enabling sends, including after a reconnect.
  useEffect(() => {
    const roomId = currentRoom?.id
    if (!roomId || !isAuthenticated || connectionInfo.status !== 'connected') return
    let cancelled = false
    const enterRoom = async () => {
      try {
        await useChatStore.getState().joinRoom(roomId)
        if (cancelled) return
        await wsJoinRoom(String(roomId))
        if (cancelled) return
        setJoinedRoomId(roomId)
        setJoinFailure(null)
        await Promise.all([
          useChatStore.getState().loadMessages(roomId),
          useChatStore.getState().loadOnlineUsers(roomId),
        ])
      } catch (error) {
        if (!cancelled) {
          setJoinFailure({
            roomId,
            message: error instanceof Error ? error.message : '加入房间失败',
          })
          handleError(error as Error)
        }
      }
    }
    void enterRoom()
    return () => {
      cancelled = true
    }
  }, [
    currentRoom?.id,
    joinAttempt,
    isAuthenticated,
    connectionInfo.status,
    wsJoinRoom,
    handleError,
  ])

  // 渲染逻辑优化
  if (authLoading) return <ChatPageSkeleton />
  if (!isAuthenticated) return null

  return (
    <ChatErrorHandler
      storeError={storeError}
      componentError={componentError}
      retryLastAction={retryLastAction}
      clearError={clearError}
      clearComponentError={clearComponentError}
      retryAction={retryAction}
    >
      <div className="chat-page-shell bg-background safe-area-top flex min-h-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Room List Sidebar - Desktop */}
          <ChatSidebar
            type="rooms"
            currentRoom={currentRoom}
            connectionInfo={connectionInfo}
            offlineState={offlineState}
            onReconnect={reconnect}
            onRetryMessages={retryFailedMessages}
            onClearQueue={clearOfflineQueue}
          />

          {/* Main Chat Area */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Mobile Sheets - 房间列表和用户列表（无房间时也可打开房间列表） */}
            <MobileSheets
              isRoomListOpen={isRoomListOpen}
              isUsersListOpen={isUsersListOpen}
              currentRoom={currentRoom}
              onRoomListOpenChange={setRoomListOpen}
              onUsersListOpenChange={setUsersListOpen}
            />

            {currentRoom ? (
              <>
                {/* Chat Header - 桌面端和移动端 */}
                <div className="hidden flex-none lg:block">
                  <ChatHeader room={currentRoom} showBackButton={false} />
                </div>
                <div className="chat-header-container flex-none lg:hidden">
                  <ChatHeader
                    room={currentRoom}
                    showBackButton={false}
                    onOpenRoomList={mobileHandlers.handleOpenRoomList}
                    onOpenUsersList={mobileHandlers.handleOpenUsersList}
                  />
                </div>

                {/* Messages - 优化移动端高度 */}
                <div
                  ref={scrollContainerRef}
                  className="chat-messages-mobile min-h-0 flex-1 overflow-y-auto"
                >
                  <MessageList
                    roomId={currentRoom.id}
                    onReply={mobileHandlers.handleReply}
                    scrollContainerRef={scrollContainerRef}
                  />
                </div>

                {joinFailure?.roomId === currentRoom.id && (
                  <div
                    role="alert"
                    className="flex items-center justify-between gap-3 border-t bg-destructive/5 px-4 py-2 text-sm"
                  >
                    <span>{joinFailure.message}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setJoinFailure(null)
                        setJoinAttempt(attempt => attempt + 1)
                      }}
                    >
                      重新加入
                    </Button>
                  </div>
                )}

                {/* Message Input */}
                <div className="chat-input-area-mobile flex-none">
                  <MessageInput
                    roomId={currentRoom.id}
                    replyingTo={replyingTo?.room_id === currentRoom.id ? replyingTo : null}
                    onCancelReply={mobileHandlers.cancelReply}
                    sendMessage={sendMessage}
                    isConnected={
                      connectionInfo.status === 'connected' && joinedRoomId === currentRoom.id
                    }
                    scrollContainerRef={scrollContainerRef}
                    onTypingStart={() => sendTyping(currentRoom.id.toString())}
                    onTypingStop={noop}
                  />
                </div>
              </>
            ) : (
              <ChatWelcome onOpenRoomList={mobileHandlers.handleOpenRoomList} />
            )}
          </div>

          {/* Online Users Sidebar - Desktop */}
          <ChatSidebar
            type="users"
            currentRoom={currentRoom}
            connectionInfo={connectionInfo}
            offlineState={offlineState}
            onReconnect={reconnect}
            onRetryMessages={retryFailedMessages}
            onClearQueue={clearOfflineQueue}
          />
        </div>
      </div>
    </ChatErrorHandler>
  )
}

export default function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ChatPageContent />
    </ChatErrorBoundary>
  )
}
