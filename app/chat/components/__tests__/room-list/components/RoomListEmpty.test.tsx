import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoomListEmpty } from '@/app/chat/components/room-list/components/RoomListEmpty'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('RoomListEmpty', () => {
  it('renders no rooms available message when no search query', () => {
    const { getByText } = render(<RoomListEmpty searchQuery="" />)
    expect(getByText('No chat rooms available')).toBeInTheDocument()
  })

  it('renders no rooms found message when search query is provided', () => {
    const { getByText } = render(<RoomListEmpty searchQuery="general" />)
    expect(getByText('No rooms found')).toBeInTheDocument()
  })

  it('renders refresh button when no search query and onRefresh provided', () => {
    const onRefresh = vi.fn()
    const { getByRole } = render(<RoomListEmpty searchQuery="" onRefresh={onRefresh} />)
    expect(getByRole('button', { name: 'Refresh Rooms' })).toBeInTheDocument()
  })

  it('does not render refresh button when search query is provided', () => {
    const onRefresh = vi.fn()
    const { queryByRole } = render(<RoomListEmpty searchQuery="general" onRefresh={onRefresh} />)
    expect(queryByRole('button', { name: 'Refresh Rooms' })).not.toBeInTheDocument()
  })

  it('does not render refresh button when onRefresh is not provided', () => {
    const { queryByRole } = render(<RoomListEmpty searchQuery="" />)
    expect(queryByRole('button', { name: 'Refresh Rooms' })).not.toBeInTheDocument()
  })

  it('calls onRefresh when button is clicked', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    const { getByRole } = render(<RoomListEmpty searchQuery="" onRefresh={onRefresh} />)

    await user.click(getByRole('button', { name: 'Refresh Rooms' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
