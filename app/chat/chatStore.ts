// 2025-09-24 claude-4-sonnet 优化过本文件代码：「优化代码」
// 2026-03-20 AI refactor: extracted duplicated toPagination to lib/utils/pagination.ts

import { create } from 'zustand'
import { mergeMessages } from './utils/merge-messages'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChatRoom, ChatMessage, OnlineUser, CreateRoomData, MessagePagination } from './types'
import { ApiRequestError, get as apiGet, post as apiPost } from '@/lib/api'
import { type ChatApiError } from '@/lib/api/chat-error-handler'
import chatCache from '@/lib/cache/chat-cache'
import { getSafeStorage } from './stores/utils/storage'
import { createThrottledFunction } from './stores/utils/throttle'
import useAuthStore from '@/stores/authStore'
import {
  getCurrentUserId,
  isOwnMessage,
  cleanRoomData,
  addOnlineUserToList,
  removeOnlineUserFromList,
  handleChatStoreError,
  setChatError,
} from './stores/utils/helpers'
import {
  calculateTotalUnreadCount,
  incrementRoomUnreadCount,
  hasUnreadMentions,
  markMentionAsRead,
  extractMentions,
} from './stores/utils/notificationHelpers'
import type { NotificationSettings, RoomNotification, MentionInfo } from './stores/types'
import { toPagination, type JsonApiPaginatedResponse } from '@/lib/utils/pagination'

export interface ChatState {
  // 核心状态
  currentRoom: ChatRoom | null
  rooms: ChatRoom[]
  messages: Record<string, ChatMessage[]>
  onlineUsers: Record<string, OnlineUser[]>
  messagesPagination: Record<string, MessagePagination>

  // UI 状态
  livePresenceRooms: Record<string, boolean>
  setLiveUsers: (roomId: number, users: OnlineUser[]) => void
  deletedMessageIds: Record<string, number[]>
  messageLoadErrors: Record<string, { message: string; page: number } | undefined>
  loadingMessageRooms: Record<string, boolean>
  isLoading: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  error: ChatApiError | null
  lastError: ChatApiError | null

  // 禁言状态
  isUserMuted: boolean
  muteUntil: string | null
  muteReason: string | null

  // 通知状态
  notifications: Record<string, RoomNotification>
  mentions: MentionInfo[]
  notificationSettings: NotificationSettings
  totalUnreadCount: number
  browserNotificationPermission: NotificationPermission

  // 房间操作
  setCurrentRoom: (room: ChatRoom | null) => void
  setRooms: (rooms: ChatRoom[]) => void
  loadRooms: () => Promise<void>
  createRoom: (roomData: CreateRoomData) => Promise<ChatRoom | undefined>
  joinRoom: (roomId: number) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>

  // 消息操作
  addMessage: (roomId: number, message: ChatMessage) => void
  applyReadState: (roomId: number, messageId: number, unreadCount: number) => void
  updateMessage: (message: ChatMessage) => void
  removeMessage: (roomId: number, messageId: number) => void
  loadMessages: (roomId: number, page?: number) => Promise<void>
  loadMoreMessages: (roomId: number) => Promise<void>
  clearMessages: (roomId: number) => void

  // 用户在线状态操作
  updateOnlineUsers: (roomId: number, users: OnlineUser[]) => void
  addOnlineUser: (roomId: number, user: OnlineUser) => void
  removeOnlineUser: (roomId: number, userId: number) => void
  loadOnlineUsers: (roomId: number) => Promise<void>
  updateRoomOnlineCount: (roomId: number, onlineCount: number) => void

  // 输入中状态（typing indicator）
  typingByRoom: Record<string, { userId: number; userName: string } | null>
  setTyping: (roomId: number, userId: number, userName: string) => void
  clearTyping: (roomId: number) => void

  // 连接管理
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void
  setConnected: (connected: boolean) => void

  // 通知操作
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  requestBrowserNotificationPermission: () => Promise<NotificationPermission>
  showBrowserNotification: (title: string, options?: NotificationOptions) => void
  incrementUnreadCount: (roomId: number) => void
  clearRoomNotifications: (roomId: number) => void
  addMention: (mention: MentionInfo) => void
  markMentionAsRead: (messageId: number) => void
  clearAllNotifications: () => void
  getTotalUnreadCount: () => number
  getRoomUnreadCount: (roomId: number) => number
  hasUnreadMentions: (roomId?: number) => boolean

  // 错误处理
  setError: (error: ChatApiError | null) => void
  clearError: () => void
  retryLastAction: () => Promise<void>

  // 禁言操作
  updateMuteStatus: (isMuted: boolean, until?: string, reason?: string) => void
  checkMuteStatus: () => boolean
  refreshMuteStatus: () => void

  // 工具方法
  setLoading: (loading: boolean) => void
  reset: () => void
  clearAllOnlineUsers: () => void
}

const initialState = {
  currentRoom: null,
  rooms: [],
  messages: {},
  onlineUsers: {},
  messagesPagination: {},
  livePresenceRooms: {},
  deletedMessageIds: {},
  messageLoadErrors: {},
  loadingMessageRooms: {},
  isLoading: false,
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  error: null,
  lastError: null,
  isUserMuted: false,
  muteUntil: null,
  muteReason: null,
  typingByRoom: {},

  // 通知状态
  notifications: {},
  mentions: [],
  notificationSettings: {
    browserNotifications: true,
    soundNotifications: true,
    mentionNotifications: true,
    roomNotifications: true,
  },
  totalUnreadCount: 0,
  browserNotificationPermission: 'default' as NotificationPermission,
}

let sessionGeneration = 0

const reconcileCurrentRoom = (state: ChatState, rooms: ChatRoom[]): Partial<ChatState> => {
  rooms = rooms.map(room =>
    state.livePresenceRooms[String(room.id)]
      ? { ...room, online_count: state.onlineUsers[String(room.id)]?.length ?? 0 }
      : room
  )
  const currentRoom = state.currentRoom
    ? (rooms.find(room => room.id === state.currentRoom?.id) ?? null)
    : null
  const cleaned =
    state.currentRoom && !currentRoom ? cleanRoomData(state, state.currentRoom.id) : {}
  const notifications = { ...state.notifications }
  for (const room of rooms) {
    if (typeof room.unread_count !== 'number') continue
    if (room.unread_count <= 0) delete notifications[String(room.id)]
    else
      notifications[String(room.id)] = {
        roomId: room.id,
        unreadCount: room.unread_count,
        lastMessageAt: notifications[String(room.id)]?.lastMessageAt ?? '',
        hasMentions: notifications[String(room.id)]?.hasMentions ?? false,
      }
  }
  for (const key of Object.keys(notifications))
    if (!rooms.some(room => String(room.id) === key)) delete notifications[key]
  return {
    ...cleaned,
    rooms,
    currentRoom,
    notifications,
    totalUnreadCount: calculateTotalUnreadCount(notifications),
  }
}

const clearMissingCurrentRoom = (state: ChatState, roomId: number): Partial<ChatState> => {
  const nextState: Partial<ChatState> = {
    ...cleanRoomData(state, roomId),
    rooms: state.rooms.filter(room => room.id !== roomId),
  }

  if (state.currentRoom?.id === roomId) {
    nextState.currentRoom = null
  }

  return nextState
}

// 工具函数已移至 stores/utils/ 目录

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 房间操作
      setCurrentRoom: room => {
        if (process.env.NODE_ENV === 'development') {
          console.log('ChatStore: Setting current room:', room)
        }

        set(state => {
          const newState = { ...state, currentRoom: room }
          // The previous room no longer has an active presence subscription.
          if (state.currentRoom?.id !== room?.id) newState.livePresenceRooms = {}

          // 确保当前房间在房间列表中
          if (room) {
            const roomExists = state.rooms.find(r => r.id === room.id)
            if (!roomExists) {
              if (process.env.NODE_ENV === 'development') {
                console.log('ChatStore: Adding current room to room list:', room)
              }
              newState.rooms = [...state.rooms, room]
            }

            // 清理其他房间的在线用户数据
            const cleanedOnlineUsers: Record<string, OnlineUser[]> = {}
            cleanedOnlineUsers[room.id.toString()] = state.onlineUsers[room.id.toString()] ?? []
            newState.onlineUsers = cleanedOnlineUsers
          } else {
            // 如果没有当前房间，清空所有在线用户数据
            if (process.env.NODE_ENV === 'development') {
              console.log('ChatStore: No current room, clearing all online users')
            }
            newState.onlineUsers = {}
          }

          return newState
        })

        // 异步处理通知清理和标记已读
        if (room) {
          setTimeout(() => {
            const currentState = get()

            // 清理房间通知
            currentState.clearRoomNotifications(room.id)

            // 标记该房间的所有提及为已读
            const updatedMentions = currentState.mentions.map(mention =>
              mention.roomId === room.id ? { ...mention, isRead: true } : mention
            )
            set({ mentions: updatedMentions })
          }, 100)
        }
      },

      setRooms: rooms => {
        const safeRooms = Array.isArray(rooms) ? rooms : []
        set(state => ({
          ...reconcileCurrentRoom(state, safeRooms),
        }))
      },

      // 使用节流的房间加载函数
      loadRooms: createThrottledFunction(async () => {
        const generation = sessionGeneration
        set({ isLoading: true, error: null })

        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('ChatStore: Loading rooms from API...')
          }
          const authState = useAuthStore.getState()

          const response = await apiGet<{ rooms: ChatRoom[] }>('/chat/rooms')
          if (generation !== sessionGeneration) return
          const rooms = response.rooms ?? []

          const safeRooms = Array.isArray(rooms) ? rooms : []

          set(state => ({
            ...reconcileCurrentRoom(state, safeRooms),
            isLoading: false,
          }))
        } catch (error) {
          if (generation !== sessionGeneration) return
          const chatError = handleChatStoreError(error, '加载聊天室失败')
          setChatError(set, chatError, { isLoading: false })
        }
      }, 1000),

      createRoom: async roomData => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiPost<{ room: ChatRoom }>('/chat/rooms', roomData)
          const newRoom = response.room
          set(state => ({
            rooms: [...state.rooms, newRoom],
            isLoading: false,
          }))
          return newRoom
        } catch (error) {
          const chatError = handleChatStoreError(error, '创建聊天室失败')
          setChatError(set, chatError, { isLoading: false })
        }
      },

      joinRoom: async roomId => {
        const generation = sessionGeneration
        set({ error: null })
        try {
          const response = await apiPost<{
            room_user?: { is_muted?: boolean; muted_until?: string }
          }>(`/chat/rooms/${roomId}/join`, {})
          if (generation !== sessionGeneration) return
          if (get().currentRoom?.id === roomId) {
            const actor = useAuthStore.getState().user
            const canModerate = actor?.is_admin || get().currentRoom?.created_by === actor?.id
            get().updateMuteStatus(
              !canModerate && Boolean(response?.room_user?.is_muted),
              response?.room_user?.muted_until
            )
          }
        } catch (error) {
          if (generation !== sessionGeneration) return
          const chatError = handleChatStoreError(error, '加入聊天室失败')
          setChatError(set, chatError)
          throw error
        }
      },

      leaveRoom: async roomId => {
        try {
          await apiPost(`/chat/rooms/${roomId}/leave`, {})

          // 离开房间时清理房间特定数据
          set(state => {
            const newState = cleanRoomData(state, roomId)

            // 如果离开的是当前房间，则清除当前房间
            if (state.currentRoom?.id === roomId) {
              newState.currentRoom = null
            }

            newState.error = null
            return newState
          })
        } catch (error) {
          const chatError = handleChatStoreError(error, '离开聊天室失败')
          setChatError(set, chatError)
        }
      },

      // 消息操作
      addMessage: (roomId, message) => {
        const state = get()
        const roomKey = roomId.toString()
        if (state.deletedMessageIds[roomKey]?.includes(message.id)) return
        const currentMessages = state.messages[roomKey] ?? []

        // 避免重复消息
        const messageExists = currentMessages.some(m => m.id === message.id)
        if (messageExists) {
          return
        }

        // 添加到缓存
        chatCache.addMessageToCache(roomKey, message)

        // 更新消息状态 - 使用函数式更新确保重新渲染
        set(prevState => {
          const newMessages = {
            ...prevState.messages,
            [roomKey]: mergeMessages(prevState.messages[roomKey] ?? [], [message]),
          }

          return {
            ...prevState,
            messages: newMessages,
          }
        })

        // 处理新消息的通知
        const isCurrentRoom = state.currentRoom?.id === roomId
        const isOwn = isOwnMessage(message)

        // 只为其他用户的消息创建通知
        if (!isOwn && message.message_type === 'text') {
          // 如果不在当前房间或标签页不活跃，增加未读计数
          if (!isCurrentRoom || (typeof document !== 'undefined' && document.hidden)) {
            get().incrementUnreadCount(roomId)
          }

          // 检查提及
          const mentions = extractMentions(message.message)
          if (mentions.length > 0 && state.notificationSettings.mentionNotifications) {
            get().addMention({
              messageId: message.id,
              roomId: roomId,
              mentionedAt: message.created_at,
              isRead: false,
            })

            // 显示提及的浏览器通知
            if (state.notificationSettings.browserNotifications) {
              get().showBrowserNotification(`${message.user.name} 提及了你`, {
                body: message.message,
                tag: `mention-${message.id}`,
              })
            }
          }

          // 为非活跃房间的新消息显示浏览器通知
          if (!isCurrentRoom && state.notificationSettings.roomNotifications) {
            const room = state.rooms.find(r => r.id === roomId)
            if (room) {
              get().showBrowserNotification(`${room.name} 有新消息`, {
                body: `${message.user.name}: ${message.message}`,
                tag: `room-${roomId}`,
              })
            }
          }
        }
      },

      applyReadState: (roomId, messageId, unreadCount) => {
        set(state => {
          const previous = state.rooms.find(room => room.id === roomId)
          if ((previous?.last_read_message_id ?? 0) > messageId) return state
          const rooms = state.rooms.map(room =>
            room.id === roomId
              ? { ...room, last_read_message_id: messageId, unread_count: unreadCount }
              : room
          )
          return {
            ...reconcileCurrentRoom(state, rooms),
            mentions: state.mentions.map(mention =>
              mention.roomId === roomId && mention.messageId <= messageId
                ? { ...mention, isRead: true }
                : mention
            ),
          }
        })
      },

      updateMessage: message => {
        const roomKey = String(message.room_id)
        if (get().deletedMessageIds[roomKey]?.includes(message.id)) return
        set(state => ({
          messages: {
            ...state.messages,
            [roomKey]: (state.messages[roomKey] ?? []).map(existing => {
              if (existing.id === message.id)
                return (existing.revision ?? 0) > (message.revision ?? 0) ? existing : message
              if (existing.reply_to_id === message.id)
                return {
                  ...existing,
                  reply_to: {
                    id: message.id,
                    message: message.message,
                    attachment_count: message.attachments?.length ?? 0,
                    user: message.user,
                    deleted: false,
                  },
                }
              return existing
            }),
          },
        }))
      },

      removeMessage: (roomId, messageId) => {
        const roomKey = String(roomId)
        chatCache.removeMessageFromCache(roomKey, messageId)
        set(state => ({
          deletedMessageIds: {
            ...state.deletedMessageIds,
            [roomKey]: [...new Set([...(state.deletedMessageIds[roomKey] ?? []), messageId])],
          },
          messages: {
            ...state.messages,
            [roomKey]: (state.messages[roomKey] ?? [])
              .filter(message => message.id !== messageId)
              .map(message =>
                message.reply_to_id === messageId
                  ? {
                      ...message,
                      reply_to: { id: messageId, deleted: true, message: null, user: null },
                    }
                  : message
              ),
          },
        }))
      },

      loadMessages: async (roomId, page = 1) => {
        const generation = sessionGeneration
        const roomKey = String(roomId)
        if (get().loadingMessageRooms[roomKey]) return
        set(state => ({
          loadingMessageRooms: { ...state.loadingMessageRooms, [roomKey]: true },
          messageLoadErrors: { ...state.messageLoadErrors, [roomKey]: undefined },
          error: null,
        }))
        try {
          // Always refresh: a cached room may have missed events while unsubscribed.
          const response = await apiGet<JsonApiPaginatedResponse<ChatMessage>>(
            `/chat/rooms/${roomId}/messages?page[number]=${page}`
          )
          if (generation !== sessionGeneration) return
          const pagination = toPagination(response)
          set(state => ({
            messages: {
              ...state.messages,
              [roomKey]: mergeMessages(state.messages[roomKey] ?? [], response.data)
                .filter(message => !state.deletedMessageIds[roomKey]?.includes(message.id))
                .map(message =>
                  message.reply_to_id &&
                  state.deletedMessageIds[roomKey]?.includes(message.reply_to_id)
                    ? {
                        ...message,
                        reply_to: {
                          id: message.reply_to_id,
                          deleted: true,
                          message: null,
                          user: null,
                        },
                      }
                    : message
                ),
            },
            messagesPagination: { ...state.messagesPagination, [roomKey]: pagination },
          }))
        } catch (error) {
          if (generation !== sessionGeneration) return
          if (error instanceof ApiRequestError && error.status === 404) {
            set(state => clearMissingCurrentRoom(state, roomId))
          } else {
            const chatError = handleChatStoreError(error, '加载消息失败')
            set(state => ({
              messageLoadErrors: {
                ...state.messageLoadErrors,
                [roomKey]: { message: chatError.message, page },
              },
            }))
            setChatError(set, chatError)
          }
        } finally {
          if (generation === sessionGeneration)
            set(state => ({
              loadingMessageRooms: { ...state.loadingMessageRooms, [roomKey]: false },
            }))
        }
      },

      loadMoreMessages: async roomId => {
        const pagination = get().messagesPagination[String(roomId)]
        if (pagination?.has_more) await get().loadMessages(roomId, pagination.current_page + 1)
      },

      clearMessages: roomId => {
        set(state => {
          const newState = { ...state }
          const roomKey = roomId.toString()

          delete newState.messages[roomKey]
          delete newState.messagesPagination[roomKey]

          return newState
        })
      },

      // 用户在线状态操作
      setLiveUsers: (roomId, users) => {
        const key = String(roomId)
        const normalized = users
          .filter(user => Number.isFinite(Number(user.id)))
          .map(user => ({
            ...user,
            id: Number(user.id),
            email: user.email ?? '',
            joined_at: user.joined_at ?? new Date().toISOString(),
            is_online: true,
          }))
        set(state => ({
          livePresenceRooms: { ...state.livePresenceRooms, [key]: true },
          onlineUsers: { ...state.onlineUsers, [key]: normalized },
          rooms: state.rooms.map(room =>
            room.id === roomId ? { ...room, online_count: normalized.length } : room
          ),
          currentRoom:
            state.currentRoom?.id === roomId
              ? { ...state.currentRoom, online_count: normalized.length }
              : state.currentRoom,
        }))
      },

      updateOnlineUsers: (roomId, users) => {
        set(state => ({
          onlineUsers: {
            ...state.onlineUsers,
            [roomId.toString()]: users,
          },
        }))
      },

      addOnlineUser: (roomId, user) => {
        set(state => {
          const roomKey = roomId.toString()
          const currentUsers = state.onlineUsers[roomKey] ?? []

          const updatedUsers = addOnlineUserToList(currentUsers, user)
          if (updatedUsers === currentUsers) return state // 用户已存在

          return {
            onlineUsers: {
              ...state.onlineUsers,
              [roomKey]: updatedUsers,
            },
          }
        })
      },

      removeOnlineUser: (roomId, userId) => {
        set(state => {
          const roomKey = roomId.toString()
          const currentUsers = state.onlineUsers[roomKey] ?? []
          const updatedUsers = removeOnlineUserFromList(currentUsers, userId)

          return {
            onlineUsers: {
              ...state.onlineUsers,
              [roomKey]: updatedUsers,
            },
          }
        })
      },

      // Explicit room switches must not share a throttle with another room.
      loadOnlineUsers: async (roomId: number) => {
        const generation = sessionGeneration
        try {
          const response = await apiGet<{ online_users: OnlineUser[]; count: number }>(
            `/chat/rooms/${roomId}/users`
          )
          if (generation !== sessionGeneration || get().livePresenceRooms[String(roomId)]) return
          set(state => ({
            onlineUsers: {
              ...state.onlineUsers,
              [roomId.toString()]: response.online_users ?? [],
            },
          }))
        } catch (error) {
          if (generation !== sessionGeneration) return
          if (error instanceof ApiRequestError && error.status === 404) {
            set(state => ({
              ...clearMissingCurrentRoom(state, roomId),
            }))
          }

          const chatError = handleChatStoreError(error, '加载在线用户失败', { showToast: false })
          set({ error: chatError })
        }
      },

      updateRoomOnlineCount: (roomId, onlineCount) => {
        if (get().livePresenceRooms[String(roomId)]) return
        set(state => ({
          rooms: state.rooms.map(room =>
            room.id === roomId ? { ...room, online_count: onlineCount } : room
          ),
        }))
      },

      setTyping: (roomId, userId, userName) => {
        const roomKey = roomId.toString()
        set(state => ({
          typingByRoom: {
            ...state.typingByRoom,
            [roomKey]: { userId, userName },
          },
        }))
        // 4 秒后自动清除（给typing事件足够的时间持续更新）
        setTimeout(() => {
          set(state => {
            const current = state.typingByRoom[roomKey]
            if (current && current.userId === userId) {
              const next = { ...state.typingByRoom, [roomKey]: null }
              return { typingByRoom: next }
            }
            return state
          })
        }, 4000)
      },

      clearTyping: roomId => {
        set(state => {
          const next = { ...state.typingByRoom }
          delete next[roomId.toString()]
          return { typingByRoom: next }
        })
      },

      // 连接管理
      setConnectionStatus: status => {
        set({
          connectionStatus: status,
          isConnected: status === 'connected',
        })
      },

      setConnected: connected => {
        set({
          isConnected: connected,
          connectionStatus: connected ? 'connected' : 'disconnected',
        })
      },

      // 通知操作
      updateNotificationSettings: settings => {
        set(state => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings,
          },
        }))
      },

      requestBrowserNotificationPermission: async () => {
        if (!('Notification' in window)) {
          set({ browserNotificationPermission: 'denied' })
          return 'denied'
        }

        const permission = await Notification.requestPermission()
        set({ browserNotificationPermission: permission })
        return permission
      },

      showBrowserNotification: (title, options = {}) => {
        const { notificationSettings, browserNotificationPermission } = get()

        if (
          !notificationSettings.browserNotifications ||
          browserNotificationPermission !== 'granted' ||
          !('Notification' in window) ||
          !document.hidden // 如果标签页活跃则不显示通知
        ) {
          return
        }

        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        })
      },

      incrementUnreadCount: roomId => {
        set(state => {
          const roomKey = roomId.toString()
          const currentNotification = state.notifications[roomKey] ?? {
            roomId,
            unreadCount: 0,
            lastMessageAt: new Date().toISOString(),
            hasMentions: false,
          }

          const updatedNotification = {
            ...currentNotification,
            unreadCount: currentNotification.unreadCount + 1,
            lastMessageAt: new Date().toISOString(),
          }

          const newNotifications = {
            ...state.notifications,
            [roomKey]: updatedNotification,
          }

          // 计算总未读数
          const totalUnreadCount = calculateTotalUnreadCount(newNotifications)

          return {
            notifications: newNotifications,
            totalUnreadCount,
          }
        })
      },

      clearRoomNotifications: roomId => {
        set(state => {
          const roomKey = roomId.toString()
          const newNotifications = { ...state.notifications }
          delete newNotifications[roomKey]

          // 计算总未读数
          const totalUnreadCount = calculateTotalUnreadCount(newNotifications)

          // 清理该房间的提及
          const newMentions = state.mentions.filter(mention => mention.roomId !== roomId)

          return {
            notifications: newNotifications,
            mentions: newMentions,
            totalUnreadCount,
          }
        })
      },

      addMention: mention => {
        set(state => {
          // 避免重复提及
          const mentionExists = state.mentions.some(m => m.messageId === mention.messageId)
          if (mentionExists) return state

          const roomKey = mention.roomId.toString()
          const currentNotification = state.notifications[roomKey] ?? {
            roomId: mention.roomId,
            unreadCount: 0,
            lastMessageAt: mention.mentionedAt,
            hasMentions: false,
          }

          const updatedNotification = {
            ...currentNotification,
            hasMentions: true,
            lastMessageAt: mention.mentionedAt,
          }

          return {
            mentions: [...state.mentions, mention],
            notifications: {
              ...state.notifications,
              [roomKey]: updatedNotification,
            },
          }
        })
      },

      markMentionAsRead: messageId => {
        set(state => ({
          mentions: markMentionAsRead(state.mentions, messageId),
        }))
      },

      clearAllNotifications: () => {
        set({
          notifications: {},
          mentions: [],
          totalUnreadCount: 0,
        })
      },

      getTotalUnreadCount: () => {
        return get().totalUnreadCount
      },

      getRoomUnreadCount: roomId => {
        const roomKey = roomId.toString()
        return get().notifications[roomKey]?.unreadCount ?? 0
      },

      hasUnreadMentions: roomId => {
        return hasUnreadMentions(get().mentions, roomId)
      },

      // 错误处理
      setError: error => set({ error, lastError: error }),

      clearError: () => set({ error: null }),

      retryLastAction: async () => {
        const { lastError } = get()
        if (!lastError || !lastError.retryable) {
          return
        }

        // 这需要根据失败的具体操作来实现
        // 目前只是清除错误
        set({ error: null })
      },

      // 禁言操作
      updateMuteStatus: (isMuted, until, reason) => {
        set({
          isUserMuted: isMuted,
          muteUntil: until || null,
          muteReason: reason || null,
        })
      },

      checkMuteStatus: () => {
        const { isUserMuted, muteUntil } = get()

        if (!isUserMuted) {
          return false
        }

        // 如果有禁言过期时间，检查是否仍然有效
        if (muteUntil) {
          const muteUntilDate = new Date(muteUntil)
          const now = new Date()

          if (muteUntilDate <= now) {
            return false
          }
        }

        return true
      },

      refreshMuteStatus: () => {
        const { isUserMuted, muteUntil } = get()
        if (!isUserMuted || !muteUntil) return

        const muteUntilDate = new Date(muteUntil)
        if (muteUntilDate <= new Date()) {
          set({
            isUserMuted: false,
            muteUntil: null,
            muteReason: null,
          })
        }
      },

      // 工具方法
      setLoading: loading => set({ isLoading: loading }),

      clearAllOnlineUsers: () => {
        set({ onlineUsers: {}, livePresenceRooms: {}, typingByRoom: {} })
      },

      reset: () => {
        sessionGeneration += 1
        set(initialState)
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => getSafeStorage()),
      // 只持久化必要数据，不包括UI状态
      partialize: state => ({
        currentRoom: state.currentRoom,
        rooms: state.rooms,
        messages: state.messages,
        messagesPagination: state.messagesPagination,
        notifications: state.notifications,
        mentions: state.mentions,
        notificationSettings: state.notificationSettings,
        totalUnreadCount: state.totalUnreadCount,
      }),
      // 重新水化时清除加载状态
      onRehydrateStorage: () => state => {
        if (state) {
          state.loadingMessageRooms = {}
          state.isLoading = false
          state.isConnected = false
          state.connectionStatus = 'disconnected'
          state.error = null

          // 重新水化时检查浏览器通知权限
          if (typeof window !== 'undefined' && 'Notification' in window) {
            state.browserNotificationPermission = Notification.permission
          } else {
            state.browserNotificationPermission = 'denied'
          }

          // 状态恢复后检查并修复状态不一致问题
          if (state.currentRoom && !state.rooms.some(room => room.id === state.currentRoom?.id)) {
            state.currentRoom = null
          }
        }
      },
    }
  )
)

export default useChatStore
export { useChatStore }
