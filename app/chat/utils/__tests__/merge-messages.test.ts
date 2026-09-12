import { it, expect } from 'vitest'
import { mergeMessages } from '../merge-messages'
import type { ChatMessage } from '../../types'

it('orders overlapping descending history pages and realtime messages once', () => {
  const message = (id: number) => ({ id, created_at: '2026-09-12T00:00:00Z' }) as ChatMessage
  expect(
    mergeMessages([message(4), message(5)], [message(4), message(3)], [message(2), message(1)]).map(
      m => m.id
    )
  ).toEqual([1, 2, 3, 4, 5])
})
