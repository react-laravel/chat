import { describe, expect, it, vi } from 'vitest'
import { cleanRoomData, addOnlineUserToList, removeOnlineUserFromList } from '../helpers'
import type { ChatState, OnlineUser } from '../../types'

// ─── Factory helpers ───────────────────────────────────────────────────────────

const createOnlineUser = (overrides: Partial<OnlineUser> = {}): OnlineUser => ({
  id: 1,
  name: 'Test User',
  avatar: null,
  ...overrides,
})

const createPartialState = (overrides: Partial<ChatState> = {}): Partial<ChatState> => ({
  messages: {},
  onlineUsers: {},
  messagesPagination: {},
  notifications: {},
  mentions: [],
  ...overrides,
})

// ─── cleanRoomData ─────────────────────────────────────────────────────────────

describe('cleanRoomData', () => {
  it('returns empty state when given an empty state', () => {
    const state = createPartialState() as ChatState
    const result = cleanRoomData(state, 1)

    expect(result.messages).toEqual({})
    expect(result.onlineUsers).toEqual({})
    expect(result.messagesPagination).toEqual({})
    expect(result.notifications).toEqual({})
    expect(result.mentions).toEqual([])
  })

  it('removes messages for the specified room', () => {
    const state = createPartialState({
      messages: { '1': [{ id: 1, text: 'hello' }], '2': [{ id: 2, text: 'world' }] },
    }) as ChatState

    const result = cleanRoomData(state, 1)

    expect(result.messages).toEqual({ '2': [{ id: 2, text: 'world' }] })
    // original state is not mutated
    expect(state.messages).toEqual({
      '1': [{ id: 1, text: 'hello' }],
      '2': [{ id: 2, text: 'world' }],
    })
  })

  it('removes onlineUsers for the specified room', () => {
    const state = createPartialState({
      onlineUsers: {
        '1': [createOnlineUser({ id: 1 }), createOnlineUser({ id: 2 })],
        '2': [createOnlineUser({ id: 3 })],
      },
    }) as ChatState

    const result = cleanRoomData(state, 1)

    expect(result.onlineUsers).toEqual({
      '2': [createOnlineUser({ id: 3 })],
    })
  })

  it('removes messagesPagination for the specified room', () => {
    const state = createPartialState({
      messagesPagination: { '1': { page: 1 }, '2': { page: 2 } },
    }) as ChatState

    const result = cleanRoomData(state, 1)

    expect(result.messagesPagination).toEqual({ '2': { page: 2 } })
  })

  it('removes notifications for the specified room', () => {
    const state = createPartialState({
      notifications: { '1': [{ id: 1 }], '2': [{ id: 2 }] },
    }) as ChatState

    const result = cleanRoomData(state, 1)

    expect(result.notifications).toEqual({ '2': [{ id: 2 }] })
  })

  it('filters mentions by roomId', () => {
    const state = createPartialState({
      mentions: [
        { roomId: 1, messageId: 1 },
        { roomId: 2, messageId: 2 },
        { roomId: 1, messageId: 3 },
      ],
    }) as ChatState

    const result = cleanRoomData(state, 1)

    expect(result.mentions).toEqual([{ roomId: 2, messageId: 2 }])
  })

  it('does not include mentions for other rooms', () => {
    const state = createPartialState({
      mentions: [{ roomId: 2, messageId: 5 }],
    }) as ChatState

    const result = cleanRoomData(state, 99)

    expect(result.mentions).toEqual([{ roomId: 2, messageId: 5 }])
  })

  it('cleans all slices simultaneously for the same roomId', () => {
    const state = createPartialState({
      messages: { '1': [{ id: 1 }] },
      onlineUsers: { '1': [createOnlineUser({ id: 1 })] },
      messagesPagination: { '1': { page: 1 } },
      notifications: { '1': [{ id: 1 }] },
      mentions: [{ roomId: 1, messageId: 1 }],
    }) as ChatState

    const result = cleanRoomData(state, 1)

    expect(result.messages).toEqual({})
    expect(result.onlineUsers).toEqual({})
    expect(result.messagesPagination).toEqual({})
    expect(result.notifications).toEqual({})
    expect(result.mentions).toEqual([])
  })
})

// ─── addOnlineUserToList ───────────────────────────────────────────────────────

describe('addOnlineUserToList', () => {
  it('adds a new user to an empty list', () => {
    const users: OnlineUser[] = []
    const newUser = createOnlineUser({ id: 1, name: 'Alice' })

    const result = addOnlineUserToList(users, newUser)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(newUser)
  })

  it('appends a new user to a non-empty list', () => {
    const users = [createOnlineUser({ id: 1 })]
    const newUser = createOnlineUser({ id: 2, name: 'Bob' })

    const result = addOnlineUserToList(users, newUser)

    expect(result).toHaveLength(2)
    expect(result[1]).toEqual(newUser)
  })

  it('does not duplicate an existing user', () => {
    const user = createOnlineUser({ id: 1, name: 'Alice' })
    const users = [user]

    const result = addOnlineUserToList(users, user)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(user)
  })

  it('does not mutate the original array', () => {
    const users = [createOnlineUser({ id: 1 })]
    const newUser = createOnlineUser({ id: 2 })

    addOnlineUserToList(users, newUser)

    expect(users).toHaveLength(1)
  })
})

// ─── removeOnlineUserFromList ──────────────────────────────────────────────────

describe('removeOnlineUserFromList', () => {
  it('returns empty array when removing from empty list', () => {
    const users: OnlineUser[] = []

    const result = removeOnlineUserFromList(users, 1)

    expect(result).toEqual([])
  })

  it('removes the user with matching id', () => {
    const users = [
      createOnlineUser({ id: 1 }),
      createOnlineUser({ id: 2 }),
      createOnlineUser({ id: 3 }),
    ]

    const result = removeOnlineUserFromList(users, 2)

    expect(result).toHaveLength(2)
    expect(result.map(u => u.id)).toEqual([1, 3])
  })

  it('returns the same array when user is not found', () => {
    const users = [createOnlineUser({ id: 1 }), createOnlineUser({ id: 2 })]

    const result = removeOnlineUserFromList(users, 99)

    expect(result).toHaveLength(2)
    expect(result).toEqual(users)
  })

  it('does not mutate the original array', () => {
    const users = [createOnlineUser({ id: 1 }), createOnlineUser({ id: 2 })]

    removeOnlineUserFromList(users, 1)

    expect(users).toHaveLength(2)
  })
})
