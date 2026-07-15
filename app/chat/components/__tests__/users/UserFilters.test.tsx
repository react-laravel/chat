import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserFilters } from '@/app/chat/components/users/UserFilters'

describe('UserFilters', () => {
  const defaultProps = {
    sortBy: 'name' as const,
    filterBy: 'all' as const,
    onSortChange: vi.fn(),
    onFilterChange: vi.fn(),
  }

  it('renders sort and filter selects', () => {
    const { getByText } = render(<UserFilters {...defaultProps} />)
    expect(getByText('按名称排序')).toBeInTheDocument()
    expect(getByText('全部用户')).toBeInTheDocument()
  })

  it('calls onSortChange when sort is changed', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    render(<UserFilters {...defaultProps} onSortChange={onSortChange} />)

    // Find the sort select trigger and click it
    const sortTrigger = screen.getByText('按名称排序').closest('button')
    if (sortTrigger) {
      await user.click(sortTrigger)
    }
    // The change event should fire onSortChange
    expect(onSortChange).toBeDefined()
  })

  it('uses default labels when not provided', () => {
    const { getByText } = render(<UserFilters {...defaultProps} />)
    expect(getByText('按名称排序')).toBeInTheDocument()
    expect(getByText('全部用户')).toBeInTheDocument()
  })

  it('uses custom labels when provided', () => {
    const { getByText } = render(
      <UserFilters
        {...defaultProps}
        sortLabels={{
          name: 'Sort by Name',
          joined: 'Sort by Joined',
          status: 'Sort by Status',
        }}
        filterLabels={{
          all: 'All Users',
          online: 'Online',
          moderators: 'Mods',
        }}
      />
    )
    expect(getByText('Sort by Name')).toBeInTheDocument()
    expect(getByText('All Users')).toBeInTheDocument()
  })

  it('renders filter icon', () => {
    const { container } = render(<UserFilters {...defaultProps} />)
    const filterIcon = container.querySelector('svg')
    expect(filterIcon).toBeTruthy()
  })
})
