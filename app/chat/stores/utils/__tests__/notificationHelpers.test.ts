import { describe, expect, it } from 'vitest'
import {
  calculateTotalUnreadCount,
  createOrUpdateRoomNotification,
  incrementRoomUnreadCount,
  hasUnreadMentions,
  markMentionAsRead,
  extractMentions,
} from '../notificationHelpers'
import type { RoomNotification, MentionInfo } from '../types'

const createNotification = (overrides: Partial<RoomNotification> = {}): RoomNotification => ({
  roomId: 1,
  unreadCount: 0,
  lastMessageAt: '2024-01-01T00:00:00Z',
  hasMentions: false,
  ...overrides,
})

const createMention = (overrides: Partial<MentionInfo> = {}): MentionInfo => ({
  messageId: 1,
  roomId: 1,
  userId: 1,
  userName: 'Test',
  isRead: false,
  ...overrides,
})

describe('notificationHelpers', () => {
  describe('calculateTotalUnreadCount', () => {
    it('should return 0 for empty notifications', () => {
      expect(calculateTotalUnreadCount({})).toBe(0)
    })

    it('should sum unread counts across rooms', () => {
      const notifications: Record<string, RoomNotification> = {
        '1': createNotification({ roomId: 1, unreadCount: 5 }),
        '2': createNotification({ roomId: 2, unreadCount: 3 }),
        '3': createNotification({ roomId: 3, unreadCount: 10 }),
      }
      expect(calculateTotalUnreadCount(notifications)).toBe(18)
    })

    it('should return 0 when all unread counts are 0', () => {
      const notifications: Record<string, RoomNotification> = {
        '1': createNotification({ roomId: 1, unreadCount: 0 }),
      }
      expect(calculateTotalUnreadCount(notifications)).toBe(0)
    })
  })

  describe('createOrUpdateRoomNotification', () => {
    it('should create new notification for room', () => {
      const result = createOrUpdateRoomNotification({}, 1, { unreadCount: 5 })
      expect(result['1'].roomId).toBe(1)
      expect(result['1'].unreadCount).toBe(5)
    })

    it('should update existing notification', () => {
      const existing: Record<string, RoomNotification> = {
        '1': createNotification({ roomId: 1, unreadCount: 3 }),
      }
      const result = createOrUpdateRoomNotification(existing, 1, { unreadCount: 10 })
      expect(result['1'].unreadCount).toBe(10)
    })

    it('should not mutate original object', () => {
      const existing: Record<string, RoomNotification> = {
        '1': createNotification({ roomId: 1, unreadCount: 3 }),
      }
      const result = createOrUpdateRoomNotification(existing, 1, { unreadCount: 10 })
      expect(existing['1'].unreadCount).toBe(3)
      expect(result['1'].unreadCount).toBe(10)
    })

    it('should preserve other room notifications', () => {
      const existing: Record<string, RoomNotification> = {
        '1': createNotification({ roomId: 1, unreadCount: 3 }),
        '2': createNotification({ roomId: 2, unreadCount: 7 }),
      }
      const result = createOrUpdateRoomNotification(existing, 1, { unreadCount: 10 })
      expect(result['2'].unreadCount).toBe(7)
    })

    it('should merge updates with existing notification', () => {
      const existing: Record<string, RoomNotification> = {
        '1': createNotification({ roomId: 1, unreadCount: 3, hasMentions: true }),
      }
      const result = createOrUpdateRoomNotification(existing, 1, { unreadCount: 10 })
      expect(result['1'].hasMentions).toBe(true)
      expect(result['1'].unreadCount).toBe(10)
    })
  })

  describe('incrementRoomUnreadCount', () => {
    it('should increment unread count from 0', () => {
      const result = incrementRoomUnreadCount({}, 1)
      expect(result['1'].unreadCount).toBe(1)
    })

    it('should increment existing unread count', () => {
      const existing: Record<string, RoomNotification> = {
        '1': createNotification({ roomId: 1, unreadCount: 5 }),
      }
      const result = incrementRoomUnreadCount(existing, 1)
      expect(result['1'].unreadCount).toBe(6)
    })

    it('should update lastMessageAt', () => {
      const before = new Date('2024-01-01T00:00:00Z').toISOString()
      const existing: Record<string, RoomNotification> = {
        '1': createNotification({ roomId: 1, lastMessageAt: before }),
      }
      const result = incrementRoomUnreadCount(existing, 1)
      expect(result['1'].lastMessageAt).not.toBe(before)
    })
  })

  describe('hasUnreadMentions', () => {
    it('should return false for empty mentions', () => {
      expect(hasUnreadMentions([])).toBe(false)
    })

    it('should return true when there are unread mentions', () => {
      const mentions = [createMention({ messageId: 1, isRead: false })]
      expect(hasUnreadMentions(mentions)).toBe(true)
    })

    it('should return false when all mentions are read', () => {
      const mentions = [createMention({ messageId: 1, isRead: true })]
      expect(hasUnreadMentions(mentions)).toBe(false)
    })

    it('should filter by roomId', () => {
      const mentions = [
        createMention({ messageId: 1, roomId: 1, isRead: false }),
        createMention({ messageId: 2, roomId: 2, isRead: false }),
      ]
      expect(hasUnreadMentions(mentions, 1)).toBe(true)
      expect(hasUnreadMentions(mentions, 2)).toBe(true)
      expect(hasUnreadMentions(mentions, 3)).toBe(false)
    })

    it('should return false when roomId specified but all matching are read', () => {
      const mentions = [createMention({ messageId: 1, roomId: 1, isRead: true })]
      expect(hasUnreadMentions(mentions, 1)).toBe(false)
    })
  })

  describe('markMentionAsRead', () => {
    it('should mark mention as read by messageId', () => {
      const mentions = [
        createMention({ messageId: 1, isRead: false }),
        createMention({ messageId: 2, isRead: false }),
      ]
      const result = markMentionAsRead(mentions, 1)
      expect(result[0].isRead).toBe(true)
      expect(result[1].isRead).toBe(false)
    })

    it('should not mutate original array', () => {
      const mentions = [createMention({ messageId: 1, isRead: false })]
      markMentionAsRead(mentions, 1)
      expect(mentions[0].isRead).toBe(false)
    })

    it('should return same array when messageId not found', () => {
      const mentions = [createMention({ messageId: 1, isRead: false })]
      const result = markMentionAsRead(mentions, 999)
      expect(result).toEqual(mentions)
    })
  })

  describe('extractMentions', () => {
    it('should extract mentions from message', () => {
      expect(extractMentions('Hello @Alice and @Bob')).toEqual(['@Alice', '@Bob'])
    })

    it('should return empty array when no mentions', () => {
      expect(extractMentions('Hello world')).toEqual([])
    })

    it('should handle empty string', () => {
      expect(extractMentions('')).toEqual([])
    })

    it('should extract single mention', () => {
      expect(extractMentions('@admin help')).toEqual(['@admin'])
    })

    it('should handle consecutive mentions', () => {
      expect(extractMentions('@a@b@c')).toEqual(['@a', '@b', '@c'])
    })
  })
})
