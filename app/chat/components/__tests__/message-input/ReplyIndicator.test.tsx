import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReplyIndicator } from '@/app/chat/components/message-input/ReplyIndicator'

const mockReplyingTo = {
  id: 42,
  user: { name: 'Alice' },
  message: 'This is the original message that the user is replying to',
}

describe('ReplyIndicator', () => {
  it('renders replying to user name', () => {
    const { getByText } = render(<ReplyIndicator replyingTo={mockReplyingTo} onCancel={vi.fn()} />)
    expect(getByText('Alice')).toBeInTheDocument()
  })

  it('renders truncated message', () => {
    const { getByText } = render(<ReplyIndicator replyingTo={mockReplyingTo} onCancel={vi.fn()} />)
    // Message should be truncated at 50 chars
    expect(getByText(/This is the original message/)).toBeInTheDocument()
  })

  it('renders cancel button', () => {
    const { getByRole } = render(<ReplyIndicator replyingTo={mockReplyingTo} onCancel={vi.fn()} />)
    expect(getByRole('button', { name: /cancel reply/i })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const { getByRole } = render(<ReplyIndicator replyingTo={mockReplyingTo} onCancel={onCancel} />)

    await user.click(getByRole('button', { name: /cancel reply/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders short message without truncation', () => {
    const shortMessage = { ...mockReplyingTo, message: 'Short msg' }
    const { getByText } = render(<ReplyIndicator replyingTo={shortMessage} onCancel={vi.fn()} />)
    expect(getByText('Short msg')).toBeInTheDocument()
  })
})
