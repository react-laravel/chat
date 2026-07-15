import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoomListError } from '@/app/chat/components/room-list/components/RoomListError'

describe('RoomListError', () => {
  it('renders error message', () => {
    const error = new Error('Failed to load')
    const onRetry = vi.fn()
    const { getByText } = render(<RoomListError error={error} onRetry={onRetry} />)

    expect(getByText('Error loading rooms')).toBeInTheDocument()
    expect(getByText('Failed to load')).toBeInTheDocument()
  })

  it('renders unknown error message when error is null', () => {
    const onRetry = vi.fn()
    const { getByText } = render(<RoomListError error={null} onRetry={onRetry} />)

    expect(getByText('Error loading rooms')).toBeInTheDocument()
    expect(getByText('Unknown error')).toBeInTheDocument()
  })

  it('renders retry button', () => {
    const onRetry = vi.fn()
    const { getByRole } = render(<RoomListError error={new Error('test')} onRetry={onRetry} />)

    expect(getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('calls onRetry when button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { getByRole } = render(<RoomListError error={new Error('test')} onRetry={onRetry} />)

    await user.click(getByRole('button', { name: 'Try Again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
