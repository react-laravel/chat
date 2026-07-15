import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatWelcome } from '../ChatWelcome'

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

describe('ChatWelcome', () => {
  it('renders welcome message', () => {
    const { getByText } = render(<ChatWelcome />)
    expect(getByText('Welcome to Chat')).toBeInTheDocument()
  })

  it('renders select room hint', () => {
    const { getByText } = render(<ChatWelcome />)
    expect(getByText('Select a room to start chatting or create a new one')).toBeInTheDocument()
  })

  it('does not render button when onOpenRoomList is not provided', () => {
    const { queryByRole } = render(<ChatWelcome />)
    expect(queryByRole('button', { name: /open room list/i })).not.toBeInTheDocument()
  })

  it('renders open room list button when onOpenRoomList is provided', () => {
    const onOpenRoomList = vi.fn()
    const { getByRole } = render(<ChatWelcome onOpenRoomList={onOpenRoomList} />)
    const button = getByRole('button', { name: /open room list/i })
    expect(button).toBeInTheDocument()
  })

  it('calls onOpenRoomList when button is clicked', async () => {
    const user = userEvent.setup()
    const onOpenRoomList = vi.fn()
    const { getByRole } = render(<ChatWelcome onOpenRoomList={onOpenRoomList} />)

    await user.click(getByRole('button', { name: /open room list/i }))
    expect(onOpenRoomList).toHaveBeenCalledTimes(1)
  })
})
