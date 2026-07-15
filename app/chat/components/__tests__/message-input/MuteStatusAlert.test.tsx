import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MuteStatusAlert } from '@/app/chat/components/message-input/MuteStatusAlert'

describe('MuteStatusAlert', () => {
  it('renders mute message', () => {
    const { getByText } = render(<MuteStatusAlert />)
    expect(getByText('您在此房间被静音')).toBeInTheDocument()
  })

  it('renders mute expiry time when provided', () => {
    const muteUntil = '2026-06-25T12:00:00.000Z'
    const { getByText } = render(<MuteStatusAlert muteUntil={muteUntil} />)
    expect(getByText(/2026/)).toBeInTheDocument()
  })

  it('renders mute reason when provided', () => {
    const { getByText } = render(<MuteStatusAlert muteReason="Spamming" />)
    expect(getByText('原因：Spamming')).toBeInTheDocument()
  })

  it('does not render expiry when muteUntil is null', () => {
    const { queryByText } = render(<MuteStatusAlert muteUntil={null} />)
    expect(queryByText(/静音时间/)).not.toBeInTheDocument()
  })

  it('does not render reason when muteReason is null', () => {
    const { queryByText } = render(<MuteStatusAlert muteReason={null} />)
    expect(queryByText(/原因/)).not.toBeInTheDocument()
  })

  it('renders with both muteUntil and muteReason', () => {
    const muteUntil = '2026-06-25T12:00:00.000Z'
    const { getByText } = render(<MuteStatusAlert muteUntil={muteUntil} muteReason="Violation" />)
    expect(getByText('您在此房间被静音')).toBeInTheDocument()
    expect(getByText(/2026/)).toBeInTheDocument()
    expect(getByText('原因：Violation')).toBeInTheDocument()
  })
})
