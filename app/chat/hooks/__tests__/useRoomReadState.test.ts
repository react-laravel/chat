import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useRoomReadState } from '../useRoomReadState'
import type { ChatMessage } from '../../types'

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  apply: vi.fn(),
  bottom: true,
}))
vi.mock('@/lib/api', () => ({ put: mocks.put }))
vi.mock('@/stores/authStore', () => ({
  default: Object.assign((select: (state: unknown) => unknown) => select({ user: { id: 1 } }), {
    getState: () => ({ user: { id: 1 } }),
  }),
}))
vi.mock('../../chatStore', () => ({
  default: Object.assign(
    (select: (state: unknown) => unknown) => select({ isConnected: true, rooms: [] }),
    { getState: () => ({ applyReadState: mocks.apply }) }
  ),
}))
vi.mock('../../components/UnreadMessageIndicator', () => ({
  useScrollPosition: () => ({ isAtBottom: mocks.bottom }),
}))
const messages = [{ id: 42 }] as ChatMessage[]

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.bottom = true
  mocks.put.mockResolvedValue({ last_read_message_id: 42, unread_count: 0 })
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  delete document.documentElement.dataset.embedVisible
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete document.documentElement.dataset.embedVisible
})

it('waits for explicit host visibility before marking an embedded conversation read', async () => {
  vi.spyOn(window, 'parent', 'get').mockReturnValue({} as Window)
  const hook = renderHook(() => useRoomReadState(7, messages))
  await act(() => vi.advanceTimersByTimeAsync(1000))
  expect(mocks.put).not.toHaveBeenCalled()
  act(() => {
    document.documentElement.dataset.embedVisible = 'true'
    document.dispatchEvent(new Event('chat:visibility'))
  })
  await act(() => vi.advanceTimersByTimeAsync(400))
  expect(mocks.put).toHaveBeenCalledWith('/chat/rooms/7/read', { message_id: 42 })
  expect(mocks.apply).toHaveBeenCalledWith(7, 42, 0)
  hook.unmount()
})

it('cancels a pending read when the host closes the widget', async () => {
  vi.spyOn(window, 'parent', 'get').mockReturnValue({} as Window)
  document.documentElement.dataset.embedVisible = 'true'
  const hook = renderHook(() => useRoomReadState(7, messages))
  act(() => {
    document.documentElement.dataset.embedVisible = 'false'
    document.dispatchEvent(new Event('chat:visibility'))
  })
  await act(() => vi.advanceTimersByTimeAsync(1000))
  expect(mocks.put).not.toHaveBeenCalled()
  hook.unmount()
})

it('does not mark messages read while browsing older history', async () => {
  mocks.bottom = false
  const hook = renderHook(() => useRoomReadState(7, messages))
  await act(() => vi.advanceTimersByTimeAsync(1000))
  expect(mocks.put).not.toHaveBeenCalled()
  hook.unmount()
})
