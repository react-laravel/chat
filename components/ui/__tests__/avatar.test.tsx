import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { AvatarImage } from '../avatar'

it('renders remote SVG avatars without relying on the Next image optimizer', () => {
  render(<AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sam" alt="Sam" />)
  expect(screen.getByRole('img', { name: 'Sam' }).getAttribute('src')).toContain(
    'https://api.dicebear.com/'
  )
})

it('calls the fallback handler and renders a new source after the old one fails', () => {
  const onError = vi.fn()
  const { rerender } = render(
    <AvatarImage src="https://example.test/broken.png" alt="Sam" onError={onError} />
  )
  fireEvent.error(screen.getByRole('img'))
  expect(onError).toHaveBeenCalledOnce()
  expect(screen.queryByRole('img')).toBeNull()
  rerender(<AvatarImage src="https://example.test/fallback.png" alt="Sam" />)
  expect(screen.getByRole('img').getAttribute('src')).toContain('fallback.png')
})
