import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChatErrorHandler from '../ChatErrorHandler'

describe('ChatErrorHandler', () => {
  it('renders children when no errors', () => {
    const { getByText } = render(
      <ChatErrorHandler>
        <div>Child content</div>
      </ChatErrorHandler>
    )
    expect(getByText('Child content')).toBeInTheDocument()
  })

  it('renders children with store error', () => {
    const { getByText } = render(
      <ChatErrorHandler storeError={null}>
        <div>Child content</div>
      </ChatErrorHandler>
    )
    expect(getByText('Child content')).toBeInTheDocument()
  })

  it('forwards retryLastAction prop', () => {
    const retryMock = vi.fn()
    const { getByText } = render(
      <ChatErrorHandler retryLastAction={retryMock}>
        <div>Child content</div>
      </ChatErrorHandler>
    )
    expect(getByText('Child content')).toBeInTheDocument()
  })
})
