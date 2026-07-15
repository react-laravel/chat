import { describe, it, expect } from 'vitest'
import { filterUsers, filterByStatus, sortUsers } from '../filterUtils'
import type { OnlineUser } from '@/app/chat/types'

const makeUsers = (): OnlineUser[] => [
  {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
    joined_at: '2024-01-10T10:00:00Z',
    is_online: true,
  },
  {
    id: 2,
    name: 'Bob',
    email: 'bob@example.com',
    role: 'moderator',
    joined_at: '2024-01-12T10:00:00Z',
    is_online: true,
  },
  {
    id: 3,
    name: 'Charlie',
    email: 'charlie@example.com',
    role: 'user',
    joined_at: '2024-01-05T10:00:00Z',
    is_online: false,
  },
  {
    id: 4,
    name: 'David',
    email: 'david@example.com',
    role: 'user',
    joined_at: '2024-01-15T10:00:00Z',
    is_online: true,
  },
]

describe('filterUsers', () => {
  it('should return all users when query is empty', () => {
    const users = makeUsers()
    expect(filterUsers(users, '')).toEqual(users)
    expect(filterUsers(users, '   ')).toEqual(users)
  })

  it('should filter by name (case insensitive)', () => {
    const users = makeUsers()
    expect(filterUsers(users, 'alice')).toEqual([users[0]])
    expect(filterUsers(users, 'ALICE')).toEqual([users[0]])
  })

  it('should filter by email (case insensitive)', () => {
    const users = makeUsers()
    expect(filterUsers(users, 'bob@example')).toEqual([users[1]])
  })

  it('should match partial names', () => {
    const users = makeUsers()
    expect(filterUsers(users, 'ali')).toEqual([users[0]])
    expect(filterUsers(users, 'char')).toEqual([users[2]])
  })

  it('should return empty array when no match', () => {
    const users = makeUsers()
    expect(filterUsers(users, 'xyz')).toEqual([])
  })
})

describe('filterByStatus', () => {
  it('should return all users for "all" filter', () => {
    const users = makeUsers()
    expect(filterByStatus(users, 'all')).toEqual(users)
  })

  it('should filter online users', () => {
    const users = makeUsers()
    const online = users.filter(u => u.is_online)
    expect(filterByStatus(users, 'online')).toEqual(online)
  })

  it('should filter moderators (admin + moderator roles)', () => {
    const users = makeUsers()
    const mods = users.filter(u => u.role === 'admin' || u.role === 'moderator')
    expect(filterByStatus(users, 'moderators')).toEqual(mods)
  })

  it('should include admins in moderators filter', () => {
    const users = makeUsers()
    expect(filterByStatus(users, 'moderators')).toContainEqual(
      expect.objectContaining({ role: 'admin' })
    )
  })
})

describe('sortUsers', () => {
  const users = makeUsers()

  it('should sort by name (alphabetical)', () => {
    const sorted = sortUsers(users, 'name')
    expect(sorted[0].name).toBe('Alice')
    expect(sorted[1].name).toBe('Bob')
    expect(sorted[sorted.length - 1].name).toBe('David')
  })

  it('should sort by joined (newest first)', () => {
    const sorted = sortUsers(users, 'joined')
    // David (Jan 15) > Bob (Jan 12) > Alice (Jan 10) > Charlie (Jan 5)
    expect(sorted[0].id).toBe(4) // David
    expect(sorted[sorted.length - 1].id).toBe(3) // Charlie
  })

  it('should sort by status (online first, then by name)', () => {
    const sorted = sortUsers(users, 'status')
    // Online users should come first
    const onlineUsers = sorted.filter(u => u.is_online)
    const offlineUsers = sorted.filter(u => !u.is_online)
    expect(onlineUsers.length).toBe(3)
    expect(offlineUsers.length).toBe(1)
    // Within online, sorted by name
    expect(onlineUsers[0].name).toBe('Alice')
    expect(onlineUsers[1].name).toBe('Bob')
  })

  it('should not mutate original array', () => {
    const original = [...users]
    sortUsers(users, 'name')
    expect(users).toEqual(original)
  })
})
