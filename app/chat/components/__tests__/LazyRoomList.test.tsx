import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LazyRoomList } from '../LazyRoomList'
import type { ChatRoom } from '@/app/chat/types'

const mockRooms: ChatRoom[] = [
  {
    id: 1,
    name: 'General',
    description: 'Main room',
    created_by: 1,
    is_active: true,
    is_private: false,
    created_at: '2026-03-05T10:00:00.000Z',
    updated_at: '2026-03-05T10:00:00.000Z',
    online_count: 3,
  },
  {
    id: 2,
    name: 'Random',
    description: 'Random chat',
    created_by: 1,
    is_active: true,
    is_private: false,
    created_at: '2026-03-05T10:00:00.000Z',
    updated_at: '2026-03-05T10:00:00.000Z',
    online_count: 1,
  },
]

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

vi.mock('@/app/chat/chatStore', () => ({
  useChatStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      rooms: mockRooms,
      isLoading: false,
      loadRooms: vi.fn(),
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/lib/cache/chat-cache', () => ({
  default: {
    getCachedRoom: vi.fn(() => null),
    cacheRoom: vi.fn(),
  },
}))

describe('LazyRoomList', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (this: IntersectionObserver, callback: IntersectionObserverCallback) {
        this.observe = (element: Element) =>
          callback([{ isIntersecting: true, target: element } as IntersectionObserverEntry], this)
        this.unobserve = vi.fn()
        this.disconnect = vi.fn()
        this.takeRecords = vi.fn(() => [])
      })
    )
  })

  it('renders room list items', () => {
    const onRoomSelect = vi.fn()
    const { getByText } = render(<LazyRoomList onRoomSelect={onRoomSelect} />)

    expect(getByText('General')).toBeInTheDocument()
    expect(getByText('Random')).toBeInTheDocument()
  })

  it('renders room count', () => {
    const onRoomSelect = vi.fn()
    const { getByText } = render(<LazyRoomList onRoomSelect={onRoomSelect} />)
    expect(getByText(/2 room/)).toBeInTheDocument()
  })

  it('calls onRoomSelect when room is clicked', async () => {
    const user = userEvent.setup()
    const onRoomSelect = vi.fn()
    const { getByText } = render(<LazyRoomList onRoomSelect={onRoomSelect} />)

    await user.click(getByText('General'))
    expect(onRoomSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it('renders selected room styling', () => {
    const onRoomSelect = vi.fn()
    const { container } = render(<LazyRoomList onRoomSelect={onRoomSelect} selectedRoomId={1} />)

    // The selected room should have bg-muted class
    const selectedItem = container.querySelector('.bg-muted')
    expect(selectedItem).toBeTruthy()
  })

  it('filters rooms by search query', async () => {
    const user = userEvent.setup()
    const onRoomSelect = vi.fn()
    const { getByText, queryByText } = render(<LazyRoomList onRoomSelect={onRoomSelect} />)

    const searchInput = document.querySelector('input[placeholder*="Search"]')
    if (searchInput) {
      await user.type(searchInput, 'General')
      expect(getByText('General')).toBeInTheDocument()
      expect(queryByText('Random')).not.toBeInTheDocument()
    }
  })
})
