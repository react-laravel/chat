import { describe, it, expect } from 'vitest'
import {
  isRecord,
  isOnlineUser,
  isChatMessage,
  isChatRoom,
  resolveRoomsResponse,
  resolveUsersResponse,
  resolveCreateRoomResponse,
  normalizeIncomingMessage,
} from '../typeGuards'
import type { ChatMessage, ChatRoom, OnlineUser } from '../types'

describe('typeGuards', () => {
  describe('isRecord', () => {
    it('should return true for plain objects', () => {
      expect(isRecord({})).toBe(true)
      expect(isRecord({ a: 1 })).toBe(true)
    })

    it('should return false for null', () => {
      expect(isRecord(null)).toBe(false)
    })

    it('should return true for arrays (typeof [] === "object")', () => {
      expect(isRecord([])).toBe(true)
    })

    it('should return false for primitives', () => {
      expect(isRecord(42)).toBe(false)
      expect(isRecord('hello')).toBe(false)
      expect(isRecord(true)).toBe(false)
      expect(isRecord(undefined)).toBe(false)
    })
  })

  describe('isOnlineUser', () => {
    it('should return true for valid OnlineUser', () => {
      expect(isOnlineUser({ id: 1, name: 'Alice', email: 'a@b.com' })).toBe(true)
      expect(isOnlineUser({ id: 0, name: '', email: '' })).toBe(true)
    })

    it('should return false for non-object', () => {
      expect(isOnlineUser(null)).toBe(false)
      expect(isOnlineUser(42)).toBe(false)
    })

    it('should return false when id is not a number', () => {
      expect(isOnlineUser({ id: '1', name: 'Alice', email: 'a@b.com' })).toBe(false)
    })

    it('should return false when name is not a string', () => {
      expect(isOnlineUser({ id: 1, name: 123, email: 'a@b.com' })).toBe(false)
    })

    it('should return false when required fields are missing', () => {
      expect(isOnlineUser({ id: 1 })).toBe(false)
      expect(isOnlineUser({ name: 'Alice' })).toBe(false)
    })
  })

  describe('isChatMessage', () => {
    const validMessage: ChatMessage = {
      id: 1,
      room_id: 1,
      user_id: 1,
      message: 'hello',
      message_type: 'text',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user: { id: 1, name: 'Alice', email: 'a@b.com' },
    }

    it('should return true for valid ChatMessage', () => {
      expect(isChatMessage(validMessage)).toBe(true)
    })

    it('should return false when message is not a string', () => {
      const bad = { ...validMessage, message: 123 }
      expect(isChatMessage(bad)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isChatMessage(null)).toBe(false)
    })
  })

  describe('isChatRoom', () => {
    const validRoom: ChatRoom = {
      id: 1,
      name: 'General',
      created_by: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    it('should return true for valid ChatRoom', () => {
      expect(isChatRoom(validRoom)).toBe(true)
    })

    it('should return false when name is not a string', () => {
      const bad = { ...validRoom, name: 123 }
      expect(isChatRoom(bad)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isChatRoom(null)).toBe(false)
    })
  })

  describe('resolveRoomsResponse', () => {
    it('should return array directly when data is an array', () => {
      const rooms: ChatRoom[] = [
        { id: 1, name: 'A', created_by: 1, is_active: true, created_at: '', updated_at: '' },
      ]
      expect(resolveRoomsResponse(rooms)).toBe(rooms)
    })

    it('should extract rooms from { rooms: [...] }', () => {
      const rooms: ChatRoom[] = [
        { id: 1, name: 'A', created_by: 1, is_active: true, created_at: '', updated_at: '' },
      ]
      expect(resolveRoomsResponse({ rooms })).toEqual(rooms)
    })

    it('should return empty array for unknown shape', () => {
      expect(resolveRoomsResponse({ unknown: true })).toEqual([])
    })
  })

  describe('resolveUsersResponse', () => {
    it('should return array directly when data is an array', () => {
      const users: OnlineUser[] = [
        { id: 1, name: 'A', email: 'a@b.com', joined_at: '', is_online: true },
      ]
      expect(resolveUsersResponse(users)).toBe(users)
    })

    it('should extract from online_users field', () => {
      const users: OnlineUser[] = [
        { id: 1, name: 'A', email: 'a@b.com', joined_at: '', is_online: true },
      ]
      expect(resolveUsersResponse({ online_users: users })).toEqual(users)
    })

    it('should extract from users field', () => {
      const users: OnlineUser[] = [
        { id: 1, name: 'A', email: 'a@b.com', joined_at: '', is_online: true },
      ]
      expect(resolveUsersResponse({ users })).toEqual(users)
    })

    it('should return empty array for unknown shape', () => {
      expect(resolveUsersResponse({ other: true })).toEqual([])
    })
  })

  describe('resolveCreateRoomResponse', () => {
    it('should extract room from { room: ChatRoom }', () => {
      const room: ChatRoom = {
        id: 1,
        name: 'A',
        created_by: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      }
      expect(resolveCreateRoomResponse({ room })).toEqual(room)
    })

    it('should return ChatRoom directly', () => {
      const room: ChatRoom = {
        id: 1,
        name: 'A',
        created_by: 1,
        is_active: true,
        created_at: '',
        updated_at: '',
      }
      expect(resolveCreateRoomResponse(room)).toEqual(room)
    })

    it('should throw for invalid payload', () => {
      expect(() => resolveCreateRoomResponse({ other: true })).toThrow(
        'Invalid create room response payload'
      )
    })
  })

  describe('normalizeIncomingMessage', () => {
    it('should return null for non-object', () => {
      expect(normalizeIncomingMessage(null)).toBeNull()
      expect(normalizeIncomingMessage('hello')).toBeNull()
      expect(normalizeIncomingMessage(42)).toBeNull()
    })

    it('should normalize a complete message', () => {
      const msg = normalizeIncomingMessage({
        id: 1,
        room_id: 2,
        user_id: 3,
        message: 'hello',
        message_type: 'text',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: { id: 3, name: 'Alice', email: 'alice@example.com' },
      })

      expect(msg).toEqual({
        id: 1,
        room_id: 2,
        user_id: 3,
        message: 'hello',
        message_type: 'text',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: { id: 3, name: 'Alice', email: 'alice@example.com' },
        reactions: undefined,
      })
    })

    it('should use current time when created_at is missing', () => {
      const msg = normalizeIncomingMessage({
        id: 1,
        room_id: 1,
        user_id: 1,
        message: 'hi',
        message_type: 'text',
        user: { id: 1, name: 'A', email: 'a@b.com' },
      })

      expect(msg).not.toBeNull()
      expect(msg!.created_at).toBeTruthy()
      expect(msg!.updated_at).toBe(msg!.created_at)
    })

    it('should handle system message type', () => {
      const msg = normalizeIncomingMessage({
        id: 1,
        room_id: 1,
        user_id: 0,
        message: 'User joined',
        message_type: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      })

      expect(msg!.message_type).toBe('system')
    })

    it('should handle { data: ChatMessage } wrapper', () => {
      const msg = normalizeIncomingMessage({
        data: {
          id: 1,
          room_id: 1,
          user_id: 1,
          message: 'hello',
          message_type: 'text',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user: { id: 1, name: 'A', email: 'a@b.com' },
        },
      })

      expect(msg).not.toBeNull()
      expect(msg!.id).toBe(1)
    })

    it('should handle reactions array', () => {
      const msg = normalizeIncomingMessage({
        id: 1,
        room_id: 1,
        user_id: 1,
        message: 'hello',
        message_type: 'text',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        reactions: [{ emoji: '👍', label: 'thumbs', count: 2, userReacted: true }],
      })

      expect(msg!.reactions).toEqual([
        { emoji: '👍', label: 'thumbs', count: 2, userReacted: true },
      ])
    })

    it('should return null for invalid id/room_id/user_id', () => {
      const bad = {
        id: 'not-a-number',
        room_id: 'not-a-number',
        user_id: Infinity,
        message: 'hi',
        message_type: 'text' as const,
      }
      expect(normalizeIncomingMessage(bad)).toBeNull()
    })

    it('should handle missing user object', () => {
      const msg = normalizeIncomingMessage({
        id: 1,
        room_id: 1,
        user_id: 99,
        message: 'hello',
        message_type: 'text',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      })

      expect(msg!.user.id).toBe(99)
      expect(msg!.user.name).toBe('Unknown')
      expect(msg!.user.email).toBe('')
    })
  })
})
