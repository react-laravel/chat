import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserSearchBar } from '@/app/chat/components/users/UserSearchBar'

describe('UserSearchBar', () => {
  it('renders search input with default placeholder', () => {
    const { getByPlaceholderText } = render(<UserSearchBar value="" onChange={vi.fn()} />)
    expect(getByPlaceholderText('Search users...')).toBeInTheDocument()
  })

  it('renders search input with custom placeholder', () => {
    const { getByPlaceholderText } = render(
      <UserSearchBar value="" onChange={vi.fn()} placeholder="Find users..." />
    )
    expect(getByPlaceholderText('Find users...')).toBeInTheDocument()
  })

  it('displays current value', () => {
    const { getByDisplayValue } = render(<UserSearchBar value="Alice" onChange={vi.fn()} />)
    expect(getByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('calls onChange when typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const view = render(<UserSearchBar value="" onChange={onChange} />)

    const input = view.getByPlaceholderText('Search users...')
    await user.type(input, 'Ali')
    expect(onChange).toHaveBeenCalled()
  })

  it('renders search icon', () => {
    const { container } = render(<UserSearchBar value="" onChange={vi.fn()} />)
    const searchIcon = container.querySelector('svg')
    expect(searchIcon).toBeTruthy()
  })

  it('has correct CSS classes', () => {
    const { container } = render(<UserSearchBar value="" onChange={vi.fn()} />)
    const input = container.querySelector('input')
    expect(input?.className).toContain('pl-8')
    expect(input?.className).toContain('h-8')
  })
})
