import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoomListHeader } from '@/app/chat/components/room-list/components/RoomListHeader'

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

describe('RoomListHeader', () => {
  const defaultProps = {
    showHeader: true,
    searchQuery: '',
    filterType: 'all' as const,
    onSearchChange: vi.fn(),
    onFilterChange: vi.fn(),
    onCreateRoom: vi.fn(),
  }

  it('renders header title when showHeader is true', () => {
    const { getByText } = render(<RoomListHeader {...defaultProps} />)
    expect(getByText('Chat Rooms')).toBeInTheDocument()
  })

  it('does not render header title when showHeader is false', () => {
    const { queryByText } = render(<RoomListHeader {...defaultProps} showHeader={false} />)
    expect(queryByText('Chat Rooms')).not.toBeInTheDocument()
  })

  it('renders create button when showHeader is true', () => {
    const { getByRole } = render(<RoomListHeader {...defaultProps} />)
    expect(getByRole('button', { name: /Create/i })).toBeInTheDocument()
  })

  it('calls onCreateRoom when create button clicked', async () => {
    const user = userEvent.setup()
    const onCreateRoom = vi.fn()
    const view = render(<RoomListHeader {...defaultProps} onCreateRoom={onCreateRoom} />)

    await user.click(view.getByRole('button', { name: /Create/i }))
    expect(onCreateRoom).toHaveBeenCalledTimes(1)
  })

  it('renders search input', () => {
    const { getByPlaceholderText } = render(<RoomListHeader {...defaultProps} />)
    expect(getByPlaceholderText('Search rooms...')).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in search', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    const view = render(<RoomListHeader {...defaultProps} onSearchChange={onSearchChange} />)

    const input = view.getByPlaceholderText('Search rooms...')
    await user.type(input, 'general')
    expect(onSearchChange).toHaveBeenCalled()
  })

  it('renders filter buttons', () => {
    const { getByRole } = render(<RoomListHeader {...defaultProps} />)
    expect(getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Favorites' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Recent' })).toBeInTheDocument()
  })

  it('calls onFilterChange when filter button clicked', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    const view = render(<RoomListHeader {...defaultProps} onFilterChange={onFilterChange} />)

    await user.click(view.getByRole('button', { name: 'Favorites' }))
    expect(onFilterChange).toHaveBeenCalledWith('favorites')
  })
})
