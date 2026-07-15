import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EditRoomDialog } from '../EditRoomDialog'
import type { ChatRoom } from '@/app/chat/types'

const mockRoom: ChatRoom = {
  id: 1,
  name: 'Test Room',
  description: 'A test room',
  created_by: 1,
  is_active: true,
  is_private: false,
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
}

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

const mockPut = vi.fn()
const mockLoadRooms = vi.fn()

vi.mock('@/lib/api', () => ({
  put: (...args: unknown[]) => mockPut(...args),
}))

vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    loadRooms: mockLoadRooms,
  }),
}))

describe('EditRoomDialog', () => {
  const defaultProps = {
    room: mockRoom,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPut.mockResolvedValue(undefined)
    mockLoadRooms.mockResolvedValue(undefined)
  })

  it('renders dialog when open', () => {
    const { getByText } = render(<EditRoomDialog {...defaultProps} />)
    expect(getByText('编辑聊天房间')).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    const { queryByText } = render(<EditRoomDialog {...defaultProps} open={false} />)
    expect(queryByText('编辑聊天房间')).not.toBeInTheDocument()
  })

  it('renders room name input with current value', () => {
    const { getByDisplayValue } = render(<EditRoomDialog {...defaultProps} />)
    expect(getByDisplayValue('Test Room')).toBeInTheDocument()
  })

  it('renders description textarea with current value', () => {
    const { getByDisplayValue } = render(<EditRoomDialog {...defaultProps} />)
    expect(getByDisplayValue('A test room')).toBeInTheDocument()
  })

  it('calls onOpenChange when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const view = render(<EditRoomDialog {...defaultProps} onOpenChange={onOpenChange} />)

    await user.click(view.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets form when room changes', async () => {
    const { getByDisplayValue, rerender } = render(<EditRoomDialog {...defaultProps} />)
    expect(getByDisplayValue('Test Room')).toBeInTheDocument()

    const newRoom = { ...mockRoom, name: 'New Name', description: 'New description' }
    rerender(<EditRoomDialog room={newRoom} open={true} onOpenChange={vi.fn()} />)

    expect(getByDisplayValue('New Name')).toBeInTheDocument()
    expect(getByDisplayValue('New description')).toBeInTheDocument()
  })
})
