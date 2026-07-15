import { describe, it, expect } from 'vitest'
import { userRoleUtils, formatJoinedDate, getInitials } from '../userUtils'
import type { OnlineUser } from '@/app/chat/types'

const makeUser = (overrides: Partial<OnlineUser> = {}): OnlineUser => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  joined_at: '2024-01-15T10:00:00Z',
  is_online: true,
  ...overrides,
})

describe('userRoleUtils', () => {
  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      expect(userRoleUtils.isAdmin(makeUser({ role: 'admin' }))).toBe(true)
    })

    it('should return false for non-admin roles', () => {
      expect(userRoleUtils.isAdmin(makeUser({ role: 'moderator' }))).toBe(false)
      expect(userRoleUtils.isAdmin(makeUser({ role: 'user' }))).toBe(false)
      expect(userRoleUtils.isAdmin(makeUser({ role: undefined }))).toBe(false)
    })
  })

  describe('isModerator', () => {
    it('should return true for moderator role', () => {
      expect(userRoleUtils.isModerator(makeUser({ role: 'moderator' }))).toBe(true)
    })

    it('should return true for admin role (admins are moderators)', () => {
      expect(userRoleUtils.isModerator(makeUser({ role: 'admin' }))).toBe(true)
    })

    it('should return false for user role', () => {
      expect(userRoleUtils.isModerator(makeUser({ role: 'user' }))).toBe(false)
    })

    it('should return false for undefined role', () => {
      expect(userRoleUtils.isModerator(makeUser({ role: undefined }))).toBe(false)
    })
  })

  describe('getUserRole', () => {
    it('should return correct role string', () => {
      expect(userRoleUtils.getUserRole(makeUser({ role: 'admin' }))).toBe('admin')
      expect(userRoleUtils.getUserRole(makeUser({ role: 'moderator' }))).toBe('moderator')
      expect(userRoleUtils.getUserRole(makeUser({ role: 'user' }))).toBe('user')
      expect(userRoleUtils.getUserRole(makeUser({ role: undefined }))).toBe('user')
    })
  })
})

describe('formatJoinedDate', () => {
  it('should return "Just now" for very recent times', () => {
    const now = new Date().toISOString()
    expect(formatJoinedDate(now)).toBe('Just now')
  })

  it('should return minutes ago', () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    expect(formatJoinedDate(thirtyMinAgo)).toBe('30m ago')
  })

  it('should return hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatJoinedDate(threeHoursAgo)).toBe('3h ago')
  })

  it('should return date string for older dates', () => {
    const oldDate = '2020-01-01T00:00:00Z'
    const result = formatJoinedDate(oldDate)
    expect(result).toBe('2020/1/1')
  })
})

describe('getInitials', () => {
  it('should return first letters of two words', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('should return first letter of single word', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('should return first letter of single short word', () => {
    expect(getInitials('A')).toBe('A')
  })

  it('should return empty string for empty input', () => {
    expect(getInitials('')).toBe('')
  })

  it('should handle single character', () => {
    expect(getInitials('X')).toBe('X')
  })

  it('should be uppercase', () => {
    expect(getInitials('alice bob')).toBe('AB')
  })

  it('should limit to 2 characters for three+ words', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB')
  })
})
