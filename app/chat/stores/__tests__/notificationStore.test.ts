import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useNotificationStore } from '../notificationStore'

const resetNotifications = () => {
  useNotificationStore.setState({
    notifications: {},
    mentions: [],
    notificationSettings: {
      browserNotifications: true,
      soundNotifications: true,
      mentionNotifications: true,
      roomNotifications: true,
    },
    totalUnreadCount: 0,
    browserNotificationPermission: 'default',
  })
}

describe('notificationStore', () => {
  beforeEach(() => {
    resetNotifications()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useNotificationStore.getState()
      expect(state.notifications).toEqual({})
      expect(state.mentions).toEqual([])
      expect(state.notificationSettings).toEqual({
        browserNotifications: true,
        soundNotifications: true,
        mentionNotifications: true,
        roomNotifications: true,
      })
      expect(state.totalUnreadCount).toBe(0)
      expect(state.browserNotificationPermission).toBe('default')
    })
  })

  describe('updateNotificationSettings', () => {
    it('should update browser notifications setting', () => {
      useNotificationStore.getState().updateNotificationSettings({ browserNotifications: false })
      expect(useNotificationStore.getState().notificationSettings.browserNotifications).toBe(false)
    })

    it('should update multiple settings at once', () => {
      useNotificationStore.getState().updateNotificationSettings({
        soundNotifications: false,
        mentionNotifications: false,
      })
      const settings = useNotificationStore.getState().notificationSettings
      expect(settings.soundNotifications).toBe(false)
      expect(settings.mentionNotifications).toBe(false)
      // Other settings should be preserved
      expect(settings.browserNotifications).toBe(true)
      expect(settings.roomNotifications).toBe(true)
    })

    it('should preserve existing settings when updating partial', () => {
      useNotificationStore.getState().updateNotificationSettings({ soundNotifications: false })
      expect(useNotificationStore.getState().notificationSettings.browserNotifications).toBe(true)
      expect(useNotificationStore.getState().notificationSettings.soundNotifications).toBe(false)
    })
  })

  describe('incrementUnreadCount', () => {
    it('should increment unread count for a room', () => {
      useNotificationStore.getState().incrementUnreadCount(1)
      expect(useNotificationStore.getState().totalUnreadCount).toBe(1)
      expect(useNotificationStore.getState().notifications['1'].unreadCount).toBe(1)
    })

    it('should accumulate unread count for same room', () => {
      const store = useNotificationStore.getState()
      act(() => {
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(1)
      })
      expect(useNotificationStore.getState().notifications['1'].unreadCount).toBe(3)
      expect(useNotificationStore.getState().totalUnreadCount).toBe(3)
    })

    it('should track unread counts for multiple rooms', () => {
      const store = useNotificationStore.getState()
      act(() => {
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(2)
      })
      const state = useNotificationStore.getState()
      expect(state.notifications['1'].unreadCount).toBe(2)
      expect(state.notifications['2'].unreadCount).toBe(1)
      expect(state.totalUnreadCount).toBe(3)
    })

    it('should set lastMessageAt timestamp', () => {
      const before = Date.now()
      useNotificationStore.getState().incrementUnreadCount(1)
      const after = Date.now()
      const lastMessageAt = useNotificationStore.getState().notifications['1'].lastMessageAt
      const timestamp = new Date(lastMessageAt).getTime()
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })
  })

  describe('clearRoomNotifications', () => {
    it('should clear notifications for a room', () => {
      const store = useNotificationStore.getState()
      act(() => {
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(2)
      })
      expect(useNotificationStore.getState().totalUnreadCount).toBe(3)

      act(() => {
        useNotificationStore.getState().clearRoomNotifications(1)
      })
      expect(useNotificationStore.getState().notifications['1']).toBeUndefined()
      expect(useNotificationStore.getState().totalUnreadCount).toBe(1)
    })

    it('should also clear mentions for that room', () => {
      const store = useNotificationStore.getState()
      act(() => {
        store.addMention({
          messageId: 1,
          roomId: 1,
          mentionedAt: new Date().toISOString(),
          isRead: false,
        })
        store.addMention({
          messageId: 2,
          roomId: 2,
          mentionedAt: new Date().toISOString(),
          isRead: false,
        })
      })
      expect(useNotificationStore.getState().mentions).toHaveLength(2)

      act(() => {
        useNotificationStore.getState().clearRoomNotifications(1)
      })
      expect(useNotificationStore.getState().mentions).toHaveLength(1)
      expect(useNotificationStore.getState().mentions[0].roomId).toBe(2)
    })
  })

  describe('addMention', () => {
    it('should add a new mention', () => {
      useNotificationStore.getState().addMention({
        messageId: 1,
        roomId: 1,
        mentionedAt: new Date().toISOString(),
        isRead: false,
      })
      expect(useNotificationStore.getState().mentions).toHaveLength(1)
      expect(useNotificationStore.getState().mentions[0].messageId).toBe(1)
    })

    it('should not add duplicate mentions', () => {
      const mention = {
        messageId: 1,
        roomId: 1,
        mentionedAt: new Date().toISOString(),
        isRead: false,
      }
      useNotificationStore.getState().addMention(mention)
      useNotificationStore.getState().addMention(mention)
      expect(useNotificationStore.getState().mentions).toHaveLength(1)
    })

    it('should mark room notification as having mentions', () => {
      useNotificationStore.getState().addMention({
        messageId: 1,
        roomId: 1,
        mentionedAt: new Date().toISOString(),
        isRead: false,
      })
      expect(useNotificationStore.getState().notifications['1'].hasMentions).toBe(true)
    })
  })

  describe('markMentionAsRead', () => {
    it('should mark mention as read', () => {
      const store = useNotificationStore.getState()
      act(() => {
        store.addMention({
          messageId: 1,
          roomId: 1,
          mentionedAt: new Date().toISOString(),
          isRead: false,
        })
      })
      expect(useNotificationStore.getState().mentions[0].isRead).toBe(false)

      act(() => {
        useNotificationStore.getState().markMentionAsRead(1)
      })
      expect(useNotificationStore.getState().mentions[0].isRead).toBe(true)
    })
  })

  describe('clearAllNotifications', () => {
    it('should clear all notifications and mentions', () => {
      const store = useNotificationStore.getState()
      act(() => {
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(2)
        store.addMention({
          messageId: 1,
          roomId: 1,
          mentionedAt: new Date().toISOString(),
          isRead: false,
        })
      })
      expect(useNotificationStore.getState().totalUnreadCount).toBe(2)
      expect(useNotificationStore.getState().mentions).toHaveLength(1)

      act(() => {
        useNotificationStore.getState().clearAllNotifications()
      })
      expect(useNotificationStore.getState().notifications).toEqual({})
      expect(useNotificationStore.getState().mentions).toEqual([])
      expect(useNotificationStore.getState().totalUnreadCount).toBe(0)
    })
  })

  describe('getRoomUnreadCount', () => {
    it('should return unread count for specific room', () => {
      const store = useNotificationStore.getState()
      act(() => {
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(1)
        store.incrementUnreadCount(2)
      })
      expect(useNotificationStore.getState().getRoomUnreadCount(1)).toBe(2)
      expect(useNotificationStore.getState().getRoomUnreadCount(2)).toBe(1)
      expect(useNotificationStore.getState().getRoomUnreadCount(99)).toBe(0)
    })
  })

  describe('hasUnreadMentions', () => {
    it('should return false when no mentions', () => {
      expect(useNotificationStore.getState().hasUnreadMentions()).toBe(false)
    })

    it('should return true when there are unread mentions', () => {
      useNotificationStore.getState().addMention({
        messageId: 1,
        roomId: 1,
        mentionedAt: new Date().toISOString(),
        isRead: false,
      })
      expect(useNotificationStore.getState().hasUnreadMentions()).toBe(true)
    })

    it('should return false when all mentions are read', () => {
      const store = useNotificationStore.getState()
      act(() => {
        store.addMention({
          messageId: 1,
          roomId: 1,
          mentionedAt: new Date().toISOString(),
          isRead: false,
        })
      })
      act(() => {
        useNotificationStore.getState().markMentionAsRead(1)
      })
      expect(useNotificationStore.getState().hasUnreadMentions()).toBe(false)
    })
  })

  describe('requestBrowserNotificationPermission', () => {
    it('should be a method that requests browser permission', () => {
      // The method exists and is callable - actual browser permission
      // request can't be tested in jsdom (Notification is non-configurable)
      expect(typeof useNotificationStore.getState().requestBrowserNotificationPermission).toBe(
        'function'
      )
    })
  })
})
