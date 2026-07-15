import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoomInfoDialog } from '../../header/RoomInfoDialog'
import type { ChatRoom, OnlineUser } from '@/app/chat/types'

const mockRoom: ChatRoom = {
  id: 1,
  name: 'General Chat',
  description: 'Main discussion room',
  created_by: 1,
  is_active: true,
  is_private: false,
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  online_count: 3,
}

const mockOnlineUsers: OnlineUser[] = [
  {
    id: 1,
    name: 'Alice',
    email: 'alice@test.com',
    joined_at: '2026-01-01T00:00:00Z',
    is_online: true,
  },
  { id: 2, name: 'Bob', email: 'bob@test.com', joined_at: '2026-01-01T00:00:00Z', is_online: true },
]

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('RoomInfoDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    room: mockRoom,
    roomOnlineUsers: mockOnlineUsers,
    onlineCount: 2,
  }

  it('renders room name', () => {
    const { getByText } = render(<RoomInfoDialog {...defaultProps} />)
    expect(getByText('General Chat')).toBeInTheDocument()
  })

  it('renders room description', () => {
    const { getByText } = render(<RoomInfoDialog {...defaultProps} />)
    expect(getByText('Main discussion room')).toBeInTheDocument()
  })

  it('renders online users count', () => {
    const { getByText } = render(<RoomInfoDialog {...defaultProps} />)
    expect(getByText('2')).toBeInTheDocument()
  })

  it('renders online user names', () => {
    const { getByText } = render(<RoomInfoDialog {...defaultProps} />)
    expect(getByText('Alice')).toBeInTheDocument()
    expect(getByText('Bob')).toBeInTheDocument()
  })

  it('renders no users message when no online users', () => {
    const { getByText } = render(
      <RoomInfoDialog {...defaultProps} roomOnlineUsers={[]} onlineCount={0} />
    )
    expect(getByText(/当前没有用户在线/)).toBeInTheDocument()
  })

  it('does not render description when room has none', () => {
    const roomWithoutDesc = { ...mockRoom, description: undefined }
    const { queryByText } = render(<RoomInfoDialog {...defaultProps} room={roomWithoutDesc} />)
    expect(queryByText('Main discussion room')).not.toBeInTheDocument()
  })
})
