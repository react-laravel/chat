import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MessageInteractions, MessageThread } from '../MessageInteractions'
import type { ChatMessage } from '@/app/chat/types'

const mockMessage: ChatMessage = {
  id: 1,
  room_id: 1,
  user_id: 1,
  message: 'Hello world',
  message_type: 'text',
  created_at: '2026-03-05T10:00:00.000Z',
  updated_at: '2026-03-05T10:00:00.000Z',
  user: { id: 1, name: 'Alice', email: 'alice@test.com' },
}

const mockMessageWithReactions: ChatMessage = {
  ...mockMessage,
  id: 2,
  reactions: [
    { emoji: '👍', label: 'thumbs up', count: 2, userReacted: true },
    { emoji: '❤️', label: 'heart', count: 1, userReacted: false },
  ],
}

vi.mock('@/app/chat/hooks/message-interactions/useMessageInteractions', () => ({
  useMessageInteractions: () => ({
    showMobileMenu: false,
    closeMenu: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchEnd: vi.fn(),
    handleTouchMove: vi.fn(),
  }),
}))

describe('MessageInteractions', () => {
  it('renders message reactions', () => {
    const { container } = render(<MessageInteractions message={mockMessageWithReactions} />)
    expect(container.textContent).toContain('👍')
    expect(container.textContent).toContain('2')
    expect(container.textContent).toContain('❤️')
    expect(container.textContent).toContain('1')
  })

  it('does not render reactions area when no reactions', () => {
    const { container } = render(<MessageInteractions message={mockMessage} />)
    expect(container.textContent).not.toContain('👍')
  })

  it('calls onReact when reaction is clicked', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    render(<MessageInteractions message={mockMessageWithReactions} onReact={onReact} />)

    const reactionButtons = screen.getAllByRole('button')
    const thumbsUpButton = reactionButtons.find(btn => btn.textContent?.includes('👍'))
    if (thumbsUpButton) {
      await user.click(thumbsUpButton)
      expect(onReact).toHaveBeenCalledWith(2, '👍')
    }
  })
})

describe('MessageThread', () => {
  const replies: ChatMessage[] = [
    {
      ...mockMessage,
      id: 10,
      message: 'First reply',
    },
    {
      ...mockMessage,
      id: 11,
      message: 'Second reply',
    },
    {
      ...mockMessage,
      id: 12,
      message: 'Third reply',
    },
  ]

  it('returns null when no replies', () => {
    const { container } = render(<MessageThread replies={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders replies', () => {
    const { getAllByText, getByText } = render(<MessageThread replies={replies} />)
    expect(getByText('3 replies')).toBeInTheDocument()
    expect(getAllByText('Alice:').length).toBeGreaterThanOrEqual(1)
    expect(getByText('First reply')).toBeInTheDocument()
  })

  it('renders singular reply label', () => {
    const { getByText } = render(<MessageThread replies={[replies[0]]} />)
    expect(getByText('1 reply')).toBeInTheDocument()
  })

  it('shows "view more" when more than 3 replies', () => {
    const manyReplies = [...replies, { ...mockMessage, id: 13, message: 'Fourth reply' }]
    const { getByText } = render(<MessageThread replies={manyReplies} />)
    expect(getByText('View 1 more replies')).toBeInTheDocument()
  })
})
