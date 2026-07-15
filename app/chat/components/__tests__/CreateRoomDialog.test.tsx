import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreateRoomDialog } from '../CreateRoomDialog'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

// Mock the chat store
const mockCreateRoom = vi.fn()
const mockJoinRoom = vi.fn()
const mockSetCurrentRoom = vi.fn()

vi.mock('@/app/chat/chatStore', () => ({
  default: () => ({
    createRoom: mockCreateRoom,
    joinRoom: mockJoinRoom,
    setCurrentRoom: mockSetCurrentRoom,
  }),
}))

describe('CreateRoomDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateRoom.mockResolvedValue({
      id: 1,
      name: 'New Room',
      created_by: 1,
      is_active: true,
      created_at: '',
      updated_at: '',
    })
    mockJoinRoom.mockResolvedValue(undefined)
    mockSetCurrentRoom.mockImplementation(() => {})
  })

  it('renders dialog when open', () => {
    const { getByText } = render(<CreateRoomDialog {...defaultProps} />)
    expect(getByText('创建新聊天房间')).toBeInTheDocument()
  })

  it('does not render dialog when closed', () => {
    const { queryByText } = render(<CreateRoomDialog {...defaultProps} open={false} />)
    expect(queryByText('创建新聊天房间')).not.toBeInTheDocument()
  })

  it('renders room name input', () => {
    const { getByPlaceholderText } = render(<CreateRoomDialog {...defaultProps} />)
    expect(getByPlaceholderText('例如：一般讨论')).toBeInTheDocument()
  })

  it('renders description textarea', () => {
    const { getByPlaceholderText } = render(<CreateRoomDialog {...defaultProps} />)
    expect(getByPlaceholderText('描述这个房间的用途...')).toBeInTheDocument()
  })

  it('renders private room switch', () => {
    const { getByText } = render(<CreateRoomDialog {...defaultProps} />)
    expect(getByText('私有房间')).toBeInTheDocument()
  })

  it('calls onOpenChange when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<CreateRoomDialog {...defaultProps} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
