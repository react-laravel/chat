import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActionButtons } from '@/app/chat/components/message-input/ActionButtons'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

vi.mock('@/app/chat/components/message-input/EmojiPicker', () => ({
  EmojiPicker: () => <div data-testid="emoji-picker">EmojiPicker</div>,
}))

describe('ActionButtons', () => {
  const defaultProps = {
    onFileUpload: vi.fn(),
    onSend: vi.fn(),
    canSend: true,
    isSending: false,
    isConnected: true,
    isEmojiPickerOpen: false,
    onEmojiPickerChange: vi.fn(),
    onEmojiSelect: vi.fn(),
  }

  it('renders file upload button', () => {
    const { getByRole } = render(<ActionButtons {...defaultProps} />)
    expect(getByRole('button', { name: /upload file/i })).toBeInTheDocument()
  })

  it('renders emoji picker', () => {
    const { getByTestId } = render(<ActionButtons {...defaultProps} />)
    expect(getByTestId('emoji-picker')).toBeInTheDocument()
  })

  it('renders send button', () => {
    const { getByRole } = render(<ActionButtons {...defaultProps} />)
    expect(getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('disables send button when canSend is false', () => {
    const { getByRole } = render(<ActionButtons {...defaultProps} canSend={false} />)
    expect(getByRole('button', { name: /send message/i })).toBeDisabled()
  })

  it('disables file upload when not connected', () => {
    const { getByRole } = render(<ActionButtons {...defaultProps} isConnected={false} />)
    expect(getByRole('button', { name: /upload file/i })).toBeDisabled()
  })

  it('disables file upload when sending', () => {
    const { getByRole } = render(<ActionButtons {...defaultProps} isSending={true} />)
    expect(getByRole('button', { name: /upload file/i })).toBeDisabled()
  })

  it('calls onSend when send button is clicked', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { getByRole } = render(<ActionButtons {...defaultProps} onSend={onSend} />)

    await user.click(getByRole('button', { name: /send message/i }))
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it('calls onFileUpload when file button is clicked', async () => {
    const user = userEvent.setup()
    const onFileUpload = vi.fn()
    const { getByRole } = render(<ActionButtons {...defaultProps} onFileUpload={onFileUpload} />)

    await user.click(getByRole('button', { name: /upload file/i }))
    expect(onFileUpload).toHaveBeenCalledTimes(1)
  })

  it('shows loading spinner when sending', () => {
    const { container } = render(<ActionButtons {...defaultProps} isSending={true} />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })
})
