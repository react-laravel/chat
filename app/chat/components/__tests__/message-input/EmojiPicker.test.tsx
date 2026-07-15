import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmojiPicker } from '@/app/chat/components/message-input/EmojiPicker'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('EmojiPicker', () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    onSelectEmoji: vi.fn(),
    disabled: false,
  }

  it('renders emoji grid', () => {
    const { container } = render(<EmojiPicker {...defaultProps} />)
    const emojiButtons = container.querySelectorAll('button')
    expect(emojiButtons.length).toBeGreaterThan(0)
  })

  it('calls onSelectEmoji when emoji is clicked', async () => {
    const user = userEvent.setup()
    const onSelectEmoji = vi.fn()
    render(<EmojiPicker {...defaultProps} onSelectEmoji={onSelectEmoji} />)

    await user.click(screen.getByRole('button', { name: /insert emoji.*😀/i }))
    expect(onSelectEmoji).toHaveBeenCalledTimes(1)
  })

  it('disables button when disabled prop is true', () => {
    const { getByRole } = render(<EmojiPicker {...defaultProps} disabled={true} />)
    // The trigger button is disabled
    const triggerButton = getByRole('button', { name: /select emoji/i })
    expect(triggerButton).toBeDisabled()
  })

  it('enables button when disabled prop is false', () => {
    const { getByRole } = render(<EmojiPicker {...defaultProps} disabled={false} />)
    const triggerButton = getByRole('button', { name: /select emoji/i })
    expect(triggerButton).not.toBeDisabled()
  })

  it('renders emojis from COMMON_EMOJIS list', () => {
    const { container } = render(<EmojiPicker {...defaultProps} />)
    // Check that at least one common emoji is rendered
    expect(container.textContent).toContain('😀')
  })
})
