import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'

// Mock the modules before importing the store
const mockApiGet = vi.fn()

vi.mock('@/lib/api', () => ({
  get: (...args) => mockApiGet(...args),
}))

vi.mock('@/lib/api/chat-error-handler', () => ({
  handleChatApiError: vi.fn((error, context) => {
    const err = new Error(context || 'Error')
    return err
  }),
}))

import { useUserStore } from '../userStore'

const mockUser = (id: number, name: string): any => ({
  id,
  name,
  email: `${name.toLowerCase()}@example.com`,
  role: 'user',
  joined_at: new Date().toISOString(),
  is_online: true,
})

describe('userStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUserStore.setState({
      onlineUsers: {},
      isLoading: false,
      error: null,
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useUserStore.getState()
      expect(state.onlineUsers).toEqual({})
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('updateOnlineUsers', () => {
    it('should update online users for a room', () => {
      const users = [mockUser(1, 'Alice'), mockUser(2, 'Bob')]
      useUserStore.getState().updateOnlineUsers(1, users)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(2)
      expect(useUserStore.getState().onlineUsers['1'][0].name).toBe('Alice')
    })

    it('should replace existing users for same room', () => {
      const initialUsers = [mockUser(1, 'Alice')]
      const newUsers = [mockUser(2, 'Bob'), mockUser(3, 'Charlie')]

      useUserStore.getState().updateOnlineUsers(1, initialUsers)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(1)

      useUserStore.getState().updateOnlineUsers(1, newUsers)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(2)
      expect(useUserStore.getState().onlineUsers['1'][0].name).toBe('Bob')
    })

    it('should keep other rooms data intact', () => {
      useUserStore.getState().updateOnlineUsers(1, [mockUser(1, 'Alice')])
      useUserStore.getState().updateOnlineUsers(2, [mockUser(2, 'Bob')])

      useUserStore.getState().updateOnlineUsers(1, [mockUser(3, 'Charlie')])

      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(1)
      expect(useUserStore.getState().onlineUsers['2']).toHaveLength(1)
      expect(useUserStore.getState().onlineUsers['2'][0].name).toBe('Bob')
    })
  })

  describe('addOnlineUser', () => {
    it('should add a user to a room', () => {
      const user = mockUser(1, 'Alice')
      useUserStore.getState().addOnlineUser(1, user)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(1)
      expect(useUserStore.getState().onlineUsers['1'][0].name).toBe('Alice')
    })

    it('should not add duplicate users', () => {
      const user = mockUser(1, 'Alice')
      useUserStore.getState().addOnlineUser(1, user)
      useUserStore.getState().addOnlineUser(1, user)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(1)
    })

    it('should add to existing users in room', () => {
      const user1 = mockUser(1, 'Alice')
      const user2 = mockUser(2, 'Bob')
      useUserStore.getState().addOnlineUser(1, user1)
      useUserStore.getState().addOnlineUser(1, user2)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(2)
    })

    it('should not mutate existing state when adding', () => {
      const user1 = mockUser(1, 'Alice')
      useUserStore.getState().addOnlineUser(1, user1)
      const stateBefore = useUserStore.getState().onlineUsers['1']

      const user2 = mockUser(2, 'Bob')
      useUserStore.getState().addOnlineUser(1, user2)

      // Original array should not be mutated
      expect(stateBefore).toHaveLength(1)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(2)
    })
  })

  describe('removeOnlineUser', () => {
    it('should remove a user from a room', () => {
      const users = [mockUser(1, 'Alice'), mockUser(2, 'Bob')]
      useUserStore.getState().updateOnlineUsers(1, users)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(2)

      useUserStore.getState().removeOnlineUser(1, 1)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(1)
      expect(useUserStore.getState().onlineUsers['1'][0].id).toBe(2)
    })

    it('should handle removing non-existent user', () => {
      const users = [mockUser(1, 'Alice')]
      useUserStore.getState().updateOnlineUsers(1, users)
      useUserStore.getState().removeOnlineUser(1, 99)
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(1)
    })

    it('should handle removing from non-existent room', () => {
      useUserStore.getState().removeOnlineUser(99, 1)
      // Removing from a room that doesn't exist creates an empty array entry
      expect(useUserStore.getState().onlineUsers['99']).toEqual([])
    })
  })

  describe('loadOnlineUsers', () => {
    it('should load online users from API', async () => {
      const mockUsers = [mockUser(1, 'Alice'), mockUser(2, 'Bob')]
      mockApiGet.mockResolvedValue({ online_users: mockUsers, count: 2 })

      await useUserStore.getState().loadOnlineUsers(1)

      expect(mockApiGet).toHaveBeenCalledWith('/chat/rooms/1/users')
      expect(useUserStore.getState().onlineUsers['1']).toHaveLength(2)
    })

    it('should handle empty response', async () => {
      mockApiGet.mockResolvedValue({})

      await useUserStore.getState().loadOnlineUsers(1)

      expect(useUserStore.getState().onlineUsers['1']).toEqual([])
    })

    it('should handle API error', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))

      await useUserStore.getState().loadOnlineUsers(1)
      expect(useUserStore.getState().error).toBeTruthy()
    })

    it('should handle response with missing online_users field', async () => {
      mockApiGet.mockResolvedValue({ count: 0 })

      await useUserStore.getState().loadOnlineUsers(1)
      expect(useUserStore.getState().onlineUsers['1']).toEqual([])
    })
  })

  describe('clearAllOnlineUsers', () => {
    it('should clear all online users', () => {
      useUserStore.getState().updateOnlineUsers(1, [mockUser(1, 'Alice')])
      useUserStore.getState().updateOnlineUsers(2, [mockUser(2, 'Bob')])
      expect(Object.keys(useUserStore.getState().onlineUsers)).toHaveLength(2)

      useUserStore.getState().clearAllOnlineUsers()
      expect(useUserStore.getState().onlineUsers).toEqual({})
    })
  })
})
