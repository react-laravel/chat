import { beforeEach, it, expect, vi } from 'vitest'
import useChatStore from '../chatStore'
import { get, post, ApiRequestError } from '@/lib/api'
import type { ChatMessage } from '../types'
import type { ChatRoom } from '../types'

vi.mock('@/lib/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  get: vi.fn(),
  post: vi.fn(),
}))
vi.mock('@/lib/api/chat-error-handler', () => ({ handleChatApiError: (e: Error) => e }))
const message = (id: number): ChatMessage => ({
  id,
  room_id: 1,
  user_id: 1,
  user: { id: 1, name: 'Sam', email: '' },
  message: `message ${id}`,
  message_type: 'system',
  created_at: '2026-09-12T00:00:00Z',
  updated_at: '2026-09-12T00:00:00Z',
})
beforeEach(() => {
  useChatStore.getState().reset()
  vi.clearAllMocks()
})

it('merges in-flight realtime messages, deduplicates requests, and loads the actual second page', async () => {
  let resolve!: (value: unknown) => void
  vi.mocked(get).mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done
      })
  )
  const pending = useChatStore.getState().loadMessages(1)
  await useChatStore.getState().loadMessages(1)
  useChatStore.getState().addMessage(1, message(4))
  resolve({ data: [message(3), message(2)], current_page: 1, last_page: 2, per_page: 2, total: 3 })
  await pending
  expect(get).toHaveBeenCalledTimes(1)
  expect(useChatStore.getState().messages['1'].map(m => m.id)).toEqual([2, 3, 4])
  vi.mocked(get).mockResolvedValueOnce({
    data: [message(2), message(1)],
    current_page: 2,
    last_page: 2,
  })
  await useChatStore.getState().loadMoreMessages(1)
  expect(get).toHaveBeenLastCalledWith('/chat/rooms/1/messages?page[number]=2')
  expect(useChatStore.getState().messages['1'].map(m => m.id)).toEqual([1, 2, 3, 4])
})

it('rejects a failed join so the UI cannot switch into a forbidden room', async () => {
  vi.mocked(post).mockRejectedValueOnce(new ApiRequestError('Room is full', 403))
  await expect(useChatStore.getState().joinRoom(2)).rejects.toThrow('Room is full')
  expect(useChatStore.getState().currentRoom).toBeNull()
})

it('refreshes the online users of each room during rapid room switches', async () => {
  vi.mocked(get)
    .mockResolvedValueOnce({ online_users: [{ id: 1, name: 'Sam' }] })
    .mockResolvedValueOnce({ online_users: [{ id: 2, name: '小林' }] })
  await useChatStore.getState().loadOnlineUsers(1)
  await useChatStore.getState().loadOnlineUsers(2)
  expect(get).toHaveBeenCalledTimes(2)
  expect(useChatStore.getState().onlineUsers['2']).toEqual([{ id: 2, name: '小林' }])
})

it('does not resurrect a deleted message from a delayed history response', async () => {
  useChatStore.setState({ messages: { '1': [message(1)] } })
  useChatStore.getState().removeMessage(1, 1)
  vi.mocked(get).mockResolvedValueOnce({ data: [message(1)], current_page: 1, last_page: 1 })
  await useChatStore.getState().loadMessages(1)
  expect(useChatStore.getState().messages['1']).toEqual([])
})

it('accepts fresh directory counts after leaving a room presence subscription', () => {
  const rooms = [1, 2].map(id => ({ id, name: `Room ${id}` }) as ChatRoom)
  useChatStore.getState().setRooms(rooms)
  useChatStore.getState().setCurrentRoom(rooms[0])
  useChatStore.getState().setLiveUsers(1, [])
  useChatStore.getState().setCurrentRoom(rooms[1])
  useChatStore.getState().setRooms([{ ...rooms[0], online_count: 3 }, rooms[1]])
  expect(useChatStore.getState().rooms[0].online_count).toBe(3)
})
