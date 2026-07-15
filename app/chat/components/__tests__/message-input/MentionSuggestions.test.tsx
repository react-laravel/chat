import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MentionSuggestions } from '@/app/chat/components/message-input/MentionSuggestions'
import type { MentionSuggestion } from '@/app/chat/types/messageInput'

const mockSuggestions: MentionSuggestion[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob', email: 'bob@test.com' },
  { id: 3, name: 'Charlie', email: 'charlie@test.com' },
]

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('MentionSuggestions', () => {
  const defaultProps = {
    suggestions: mockSuggestions,
    selectedIndex: 0,
    onSelect: vi.fn(),
  }

  it('returns null when suggestions are empty', () => {
    const { container } = render(
      <MentionSuggestions suggestions={[]} selectedIndex={0} onSelect={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders all suggestions', () => {
    const { getByText } = render(<MentionSuggestions {...defaultProps} />)
    expect(getByText('Alice')).toBeInTheDocument()
    expect(getByText('Bob')).toBeInTheDocument()
    expect(getByText('Charlie')).toBeInTheDocument()
  })

  it('renders user emails', () => {
    const { getByText } = render(<MentionSuggestions {...defaultProps} />)
    expect(getByText('alice@test.com')).toBeInTheDocument()
    expect(getByText('bob@test.com')).toBeInTheDocument()
  })

  it('highlights selected suggestion', () => {
    const { container } = render(<MentionSuggestions {...defaultProps} selectedIndex={0} />)
    const selectedButton = container.querySelector('[aria-selected="true"]')
    expect(selectedButton).toBeTruthy()
  })

  it('calls onSelect when suggestion is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const view = render(<MentionSuggestions {...defaultProps} onSelect={onSelect} />)

    const bobButton = view.getByText('Bob').closest('button')
    if (bobButton) {
      await user.click(bobButton)
    }
    expect(onSelect).toHaveBeenCalledWith({ id: 2, name: 'Bob', email: 'bob@test.com' })
  })

  it('highlights correct suggestion when selectedIndex changes', () => {
    const { container } = render(<MentionSuggestions {...defaultProps} selectedIndex={1} />)
    const selectedButton = container.querySelector('[aria-selected="true"]')
    expect(selectedButton?.textContent).toContain('Bob')
  })

  it('renders correct aria attributes', () => {
    const { container } = render(<MentionSuggestions {...defaultProps} />)
    const listbox = container.querySelector('[role="listbox"]')
    expect(listbox).toBeTruthy()
    expect(listbox?.getAttribute('aria-label')).toContain('Mention suggestions')

    const options = container.querySelectorAll('[role="option"]')
    expect(options.length).toBe(3)
  })
})
