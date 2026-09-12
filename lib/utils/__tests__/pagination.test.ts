import { describe, it, expect } from 'vitest'
import { toPagination } from '../pagination'

describe('chat-api pagination', () => {
  it('reads the Laravel paginator and advances until the last page', () => {
    expect(
      toPagination({
        data: [],
        current_page: 2,
        last_page: 3,
        per_page: 30,
        total: 65,
        next_page_url: '?page[number]=3',
      })
    ).toMatchObject({ current_page: 2, last_page: 3, has_more: true, total: 65 })
    expect(
      toPagination({ data: [], current_page: 3, last_page: 3, next_page_url: null }).has_more
    ).toBe(false)
  })
})
