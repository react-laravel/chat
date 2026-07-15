import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'

// Use vi.hoisted() so mocks are available when vi.mock() factories run
const mockApiGet = vi.hoisted(() => vi.fn())
const mockApiPost = vi.hoisted(() => vi.fn())
const mockDistributedLock = vi.hoisted(() => ({
  withLock: vi.fn(),
}))
const mockHandleChatApiError = vi.hoisted(() =>
  vi.fn((error: any, context?: string) => {
    const err = new Error(context || 'Error')
    return err
  })
)

vi.mock('@/lib/api', () => ({
  get: (...args: any[]) => mockApiGet(...args),
  post: (...args: any[]) => mockApiPost(...args),
}))

vi.mock('@/lib/api/chat-error-handler', () => ({
  handleChatApiError: mockHandleChatApiError,
}))

vi.mock('@/lib/utils/distributed-lock', () => ({
  distributedLock: {
    withLock: (...args: any[]) => mockDistributedLock.withLock(...args),
  },
}))

// Import after mocks
import { useRoomStore } from '../roomStore'

describe('roomStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRoomStore.setState({
      currentRoom: null,
      rooms: [],
      isLoading: false,
      error: null,
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useRoomStore.getState()
      expect(state.currentRoom).toBeNull()
      expect(state.rooms).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setCurrentRoom', () => {
    it('should set current room', () => {
      const room = {
        id: 1,
        name: 'Test',
        created_by: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      }
      useRoomStore.getState().setCurrentRoom(room)
      expect(useRoomStore.getState().currentRoom).toEqual(room)
    })

    it('should clear current room', () => {
      const room = {
        id: 1,
        name: 'Test',
        created_by: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      }
      useRoomStore.getState().setCurrentRoom(room)
      useRoomStore.getState().setCurrentRoom(null)
      expect(useRoomStore.getState().currentRoom).toBeNull()
    })
  })

  describe('setRooms', () => {
    it('should set rooms array', () => {
      const rooms = [
        { id: 1, name: 'Room 1', created_by: 1, is_active: true, created_at: '', updated_at: '' },
        { id: 2, name: 'Room 2', created_by: 1, is_active: true, created_at: '', updated_at: '' },
      ]
      useRoomStore.getState().setRooms(rooms)
      expect(useRoomStore.getState().rooms).toHaveLength(2)
    })

    it('should handle non-array input', () => {
      // @ts-ignore - testing runtime behavior
      useRoomStore.getState().setRooms(null)
      expect(useRoomStore.getState().rooms).toEqual([])
    })
  })

  describe('loadRooms', () => {
    it('should load rooms successfully', async () => {
      const mockRooms = [
        { id: 1, name: 'General', created_by: 1, is_active: true, created_at: '', updated_at: '' },
        { id: 2, name: 'Random', created_by: 1, is_active: true, created_at: '', updated_at: '' },
      ]
      mockApiGet.mockResolvedValue({ rooms: mockRooms })

      await useRoomStore.getState().loadRooms()

      expect(mockApiGet).toHaveBeenCalledWith('/chat/rooms')
      expect(useRoomStore.getState().rooms).toHaveLength(2)
      expect(useRoomStore.getState().isLoading).toBe(false)
    })

    it('should handle empty rooms response', async () => {
      mockApiGet.mockResolvedValue({})

      await useRoomStore.getState().loadRooms()

      expect(useRoomStore.getState().rooms).toEqual([])
    })

    it('should handle API error', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))

      await expect(useRoomStore.getState().loadRooms()).rejects.toThrow()
      expect(useRoomStore.getState().isLoading).toBe(false)
      expect(useRoomStore.getState().error).toBeTruthy()
    })

    it('should set loading state during request', async () => {
      let resolvePromise: (value: { rooms: [] }) => void
      const promise = new Promise<{ rooms: [] }>(resolve => {
        resolvePromise = resolve
      })
      mockApiGet.mockReturnValue(promise)

      // Start loading
      const loadPromise = useRoomStore.getState().loadRooms()
      expect(useRoomStore.getState().isLoading).toBe(true)

      // Resolve
      resolvePromise({ rooms: [] })
      await loadPromise
      expect(useRoomStore.getState().isLoading).toBe(false)
    })
  })

  describe('createRoom', () => {
    it('should create room with distributed lock', async () => {
      const newRoom = {
        id: 1,
        name: 'New Room',
        created_by: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      }
      mockDistributedLock.withLock.mockResolvedValue({
        success: true,
        result: { room: newRoom },
      })

      const result = await useRoomStore.getState().createRoom({ name: 'New Room' })

      expect(mockDistributedLock.withLock).toHaveBeenCalledWith(
        'room:create:New Room',
        expect.any(Function),
        { ttl: 10000, maxRetries: 3 }
      )
      expect(useRoomStore.getState().rooms).toContainEqual(newRoom)
      expect(result).toEqual(newRoom)
    })

    it('should handle lock failure', async () => {
      mockDistributedLock.withLock.mockResolvedValue({
        success: false,
        error: new Error('Lock failed'),
      })

      await expect(useRoomStore.getState().createRoom({ name: 'Test' })).rejects.toThrow()
      expect(useRoomStore.getState().error).toBeTruthy()
    })

    it('should handle API error when lock callback fails', async () => {
      // When the lock callback (which calls apiPost) fails,
      // withLock returns { success: false, error }
      mockDistributedLock.withLock.mockResolvedValue({
        success: false,
        error: new Error('API Error'),
      })

      await expect(useRoomStore.getState().createRoom({ name: 'Test' })).rejects.toThrow()
      expect(useRoomStore.getState().error).toBeTruthy()
    })
  })

  describe('joinRoom', () => {
    it('should join room with distributed lock', async () => {
      mockDistributedLock.withLock.mockResolvedValue({ success: true, result: true })

      await expect(useRoomStore.getState().joinRoom(1)).resolves.toBeUndefined()

      expect(mockDistributedLock.withLock).toHaveBeenCalledWith(
        'room:join:1',
        expect.any(Function),
        { ttl: 5000, maxRetries: 5 }
      )
    })

    it('should handle join failure', async () => {
      mockDistributedLock.withLock.mockResolvedValue({
        success: false,
        error: new Error('Join failed'),
      })

      await expect(useRoomStore.getState().joinRoom(1)).rejects.toThrow()
      expect(useRoomStore.getState().error).toBeTruthy()
    })
  })

  describe('leaveRoom', () => {
    it('should leave room and clear currentRoom if matching', async () => {
      mockDistributedLock.withLock.mockResolvedValue({ success: true, result: true })
      const room = {
        id: 1,
        name: 'Test',
        created_by: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      }

      useRoomStore.getState().setCurrentRoom(room)
      expect(useRoomStore.getState().currentRoom).toEqual(room)

      await useRoomStore.getState().leaveRoom(1)
      expect(useRoomStore.getState().currentRoom).toBeNull()
    })

    it('should not clear currentRoom when leaving different room', async () => {
      mockDistributedLock.withLock.mockResolvedValue({ success: true, result: true })
      const room = {
        id: 1,
        name: 'Test',
        created_by: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      }

      useRoomStore.getState().setCurrentRoom(room)
      await useRoomStore.getState().leaveRoom(2)

      expect(useRoomStore.getState().currentRoom).toEqual(room)
    })

    it('should handle leave failure', async () => {
      mockDistributedLock.withLock.mockResolvedValue({
        success: false,
        error: new Error('Leave failed'),
      })

      await expect(useRoomStore.getState().leaveRoom(1)).rejects.toThrow()
      expect(useRoomStore.getState().error).toBeTruthy()
    })
  })

  describe('updateRoomOnlineCount', () => {
    it('should update online count for a room', () => {
      const rooms = [
        {
          id: 1,
          name: 'Room 1',
          online_count: 0,
          created_by: 1,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          name: 'Room 2',
          online_count: 0,
          created_by: 1,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
      ]
      useRoomStore.getState().setRooms(rooms)

      useRoomStore.getState().updateRoomOnlineCount(1, 5)
      expect(useRoomStore.getState().rooms[0].online_count).toBe(5)
      expect(useRoomStore.getState().rooms[1].online_count).toBe(0)
    })
  })
})
