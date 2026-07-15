import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeleteRoomDialog } from '../DeleteRoomDialog'
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
  online_count: 0,
}

// Mock the chat store
const mockRooms: ChatRoom[] = [mockRoom]
const mockSetRooms = vi.fn()
const mockSetCurrentRoom = vi.fn()

vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    rooms: mockRooms,
    currentRoom: null,
    setRooms: mockSetRooms,
    setCurrentRoom: mockSetCurrentRoom,
  }),
}))

describe('DeleteRoomDialog', () => {
  const defaultProps = {
    room: mockRoom,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRooms.length = 0
    mockRooms.push(mockRoom)
  })

  it('renders dialog when open', () => {
    const { getAllByText } = render(<DeleteRoomDialog {...defaultProps} />)
    expect(getAllByText('Delete Room').length).toBeGreaterThanOrEqual(1)
  })

  it('does not render dialog when closed', () => {
    const { queryByText } = render(<DeleteRoomDialog {...defaultProps} open={false} />)
    expect(queryByText('Delete Room')).not.toBeInTheDocument()
  })

  it('renders confirmation input', () => {
    const { getByPlaceholderText } = render(<DeleteRoomDialog {...defaultProps} />)
    expect(getByPlaceholderText('Test Room')).toBeInTheDocument()
  })

  it('renders room details', () => {
    const { getByText } = render(<DeleteRoomDialog {...defaultProps} />)
    expect(getByText('Name: Test Room')).toBeInTheDocument()
    expect(getByText('Description: A test room')).toBeInTheDocument()
  })

  it('shows warning when room has online users', () => {
    const roomWithUsers = { ...mockRoom, online_count: 5 }
    const { getByText } = render(<DeleteRoomDialog {...defaultProps} room={roomWithUsers} />)
    expect(getByText(/5 online user/)).toBeInTheDocument()
  })

  it('delete button is disabled without confirmation', () => {
    const { getByRole } = render(<DeleteRoomDialog {...defaultProps} />)
    const deleteButton = getByRole('button', { name: /^Delete Room$/ })
    expect(deleteButton).toBeDisabled()
  })

  it('delete button is enabled after correct confirmation', async () => {
    const user = userEvent.setup()
    const { getByPlaceholderText, getByRole } = render(<DeleteRoomDialog {...defaultProps} />)

    const input = getByPlaceholderText('Test Room')
    await user.type(input, 'Test Room')

    const deleteButton = getByRole('button', { name: /^Delete Room$/ })
    expect(deleteButton).not.toBeDisabled()
  })

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { getByRole } = render(<DeleteRoomDialog {...defaultProps} onOpenChange={onOpenChange} />)

    await user.click(getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
