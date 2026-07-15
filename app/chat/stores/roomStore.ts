/**
 * 房间管理状态
 */
import { create } from 'zustand'
import type { ChatRoom, CreateRoomData } from '../types'
import { get as apiGet, post as apiPost } from '@/lib/api'
import { handleChatApiError } from '@/lib/api/chat-error-handler'
import { distributedLock } from '@/lib/utils/distributed-lock'

interface RoomState {
  currentRoom: ChatRoom | null
  rooms: ChatRoom[]
  isLoading: boolean
  error: Error | null
}

interface RoomActions {
  setCurrentRoom: (room: ChatRoom | null) => void
  setRooms: (rooms: ChatRoom[]) => void
  loadRooms: () => Promise<void>
  createRoom: (roomData: CreateRoomData) => Promise<ChatRoom>
  joinRoom: (roomId: number) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>
  updateRoomOnlineCount: (roomId: number, onlineCount: number) => void
}

export type RoomStore = RoomState & RoomActions

export const useRoomStore = create<RoomStore>(set => ({
  currentRoom: null,
  rooms: [],
  isLoading: false,
  error: null,

  setCurrentRoom: room => {
    set({ currentRoom: room })
  },

  setRooms: rooms => {
    const safeRooms = Array.isArray(rooms) ? rooms : []
    set({ rooms: safeRooms })
  },

  loadRooms: async () => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiGet<{ rooms: ChatRoom[] }>('/chat/rooms')
      const rooms = response.rooms ?? []
      const safeRooms = Array.isArray(rooms) ? rooms : []

      set({ rooms: safeRooms, isLoading: false })
    } catch (error) {
      const chatError = handleChatApiError(error, '加载聊天室失败', {
        showToast: true,
        retryable: true,
      })
      set({
        error: chatError,
        isLoading: false,
      })
      throw chatError
    }
  },

  createRoom: async roomData => {
    set({ isLoading: true, error: null })

    // Use distributed lock to prevent duplicate room creation
    const lockResource = `room:create:${roomData.name || 'unnamed'}`
    const lockResult = await distributedLock.withLock(
      lockResource,
      async () => {
        const response = await apiPost<{ room: ChatRoom }>('/chat/rooms', roomData)
        return response
      },
      { ttl: 10000, maxRetries: 3 }
    )

    if (!lockResult.success) {
      const chatError = handleChatApiError(lockResult.error, '创建聊天室失败（资源被锁定）', {
        showToast: true,
        retryable: true,
      })
      set({ error: chatError, isLoading: false })
      throw chatError
    }

    try {
      const newRoom = lockResult.result!.room
      set(state => ({
        rooms: [...state.rooms, newRoom],
        isLoading: false,
      }))
      return newRoom
    } catch (error) {
      const chatError = handleChatApiError(error, '创建聊天室失败', {
        showToast: true,
        retryable: true,
      })
      set({ error: chatError, isLoading: false })
      throw chatError
    }
  },

  joinRoom: async roomId => {
    set({ error: null })

    // Use distributed lock to prevent duplicate join requests
    const lockResource = `room:join:${roomId}`
    const lockResult = await distributedLock.withLock(
      lockResource,
      async () => {
        await apiPost(`/chat/rooms/${roomId}/join`, {})
        return true
      },
      { ttl: 5000, maxRetries: 5 }
    )

    if (!lockResult.success) {
      const chatError = handleChatApiError(lockResult.error, '加入聊天室失败（请求正在处理中）', {
        showToast: true,
        retryable: true,
      })
      set({ error: chatError })
      throw chatError
    }
  },

  leaveRoom: async roomId => {
    // Use distributed lock to ensure clean leave operation
    const lockResource = `room:leave:${roomId}`
    const lockResult = await distributedLock.withLock(
      lockResource,
      async () => {
        await apiPost(`/chat/rooms/${roomId}/leave`, {})
        return true
      },
      { ttl: 5000, maxRetries: 3 }
    )

    if (!lockResult.success) {
      const chatError = handleChatApiError(lockResult.error, '离开聊天室失败（操作被锁定）', {
        showToast: true,
        retryable: true,
      })
      set({ error: chatError })
      throw chatError
    }

    set(state => {
      const newState = { ...state }
      if (state.currentRoom?.id === roomId) {
        newState.currentRoom = null
      }
      newState.error = null
      return newState
    })
  },

  updateRoomOnlineCount: (roomId, onlineCount) => {
    set(state => ({
      rooms: state.rooms.map(room =>
        room.id === roomId ? { ...room, online_count: onlineCount } : room
      ),
    }))
  },
}))
