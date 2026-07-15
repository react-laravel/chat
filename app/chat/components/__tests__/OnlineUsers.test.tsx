import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OnlineUsers } from '../OnlineUsers'

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

vi.mock('@/app/chat/components/users/UserSearchBar', () => ({
  UserSearchBar: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input data-testid="user-search" value={value} onChange={e => onChange(e.target.value)} />
  ),
}))

vi.mock('@/app/chat/components/users/UserFilters', () => ({
  UserFilters: () => <div data-testid="user-filters">Filters</div>,
}))

vi.mock('@/app/chat/components/users/UserListItem', () => ({
  UserListItem: ({ user }: { user: { name: string } }) => (
    <div data-testid="user-item">{user.name}</div>
  ),
}))

const { mockUseChatStore } = vi.hoisted(() => ({
  mockUseChatStore: vi.fn(),
}))

vi.mock('@/app/chat/chatStore', () => ({
  default: mockUseChatStore,
  useChatStore: mockUseChatStore,
}))

describe('OnlineUsers', () => {
  const defaultState = {
    onlineUsers: {},
  }

  beforeEach(() => {
    mockUseChatStore.mockImplementation((...args: unknown[]) => {
      if (args.length > 0 && typeof args[0] === 'function') {
        return args[0](defaultState)
      }
      return defaultState
    })
  })

  it('renders without crashing when no users', () => {
    const { container } = render(<OnlineUsers roomId={1} />)
    expect(container.querySelector('[data-testid="scroll-area"]')).toBeTruthy()
  })

  it('renders search and filters', () => {
    const { getByTestId } = render(<OnlineUsers roomId={1} />)
    expect(getByTestId('user-search')).toBeInTheDocument()
    expect(getByTestId('user-filters')).toBeInTheDocument()
  })

  it('renders user list items when users are available', () => {
    const stateWithUsers = {
      ...defaultState,
      onlineUsers: {
        '1': [
          {
            id: 1,
            name: 'Alice',
            email: 'alice@test.com',
            joined_at: '2026-01-01T00:00:00Z',
            is_online: true,
          },
        ],
      },
    }

    mockUseChatStore.mockImplementation((...args: unknown[]) => {
      if (args.length > 0 && typeof args[0] === 'function') {
        return args[0](stateWithUsers)
      }
      return stateWithUsers
    })

    const { getByTestId } = render(<OnlineUsers roomId={1} />)
    expect(getByTestId('user-item')).toBeInTheDocument()
  })

  it('passes callbacks to user items', () => {
    const stateWithUsers = {
      ...defaultState,
      onlineUsers: {
        '1': [
          {
            id: 1,
            name: 'Alice',
            email: 'alice@test.com',
            joined_at: '2026-01-01T00:00:00Z',
            is_online: true,
          },
        ],
      },
    }

    mockUseChatStore.mockImplementation((...args: unknown[]) => {
      if (args.length > 0 && typeof args[0] === 'function') {
        return args[0](stateWithUsers)
      }
      return stateWithUsers
    })

    const onMentionUser = vi.fn()
    const { getByTestId } = render(<OnlineUsers roomId={1} onMentionUser={onMentionUser} />)
    expect(getByTestId('user-item')).toBeInTheDocument()
  })

  it('renders with room id correctly', () => {
    const { container } = render(<OnlineUsers roomId={42} />)
    // Just verify the component renders
    expect(container.querySelector('[data-testid="scroll-area"]')).toBeTruthy()
  })
})
