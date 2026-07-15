import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMentions } from '@/app/chat/hooks/message-input/useMentions'

const createUser = (id: number, name: string, email: string) => ({
  id,
  name,
  email,
})

describe('useMentions', () => {
  const roomUsers = [
    createUser(1, 'Alice', 'alice@test.com'),
    createUser(2, 'Bob', 'bob@test.com'),
    createUser(3, 'Charlie', 'charlie@test.com'),
  ]

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useMentions(roomUsers))
    expect(result.current.showMentions).toBe(false)
    expect(result.current.mentionQuery).toBe('')
    expect(result.current.mentionSuggestions).toEqual([])
    expect(result.current.selectedMentionIndex).toBe(0)
  })

  it('shows mention suggestions when @ is typed', () => {
    const { result } = renderHook(() => useMentions(roomUsers))

    act(() => {
      result.current.checkForMentions('Hello @ali', 10)
    })

    expect(result.current.showMentions).toBe(true)
    expect(result.current.mentionSuggestions).toHaveLength(1)
    expect(result.current.mentionSuggestions[0].name).toBe('Alice')
  })

  it('hides suggestions when no @ is found', () => {
    const { result } = renderHook(() => useMentions(roomUsers))

    act(() => {
      result.current.checkForMentions('Hello world', 11)
    })

    expect(result.current.showMentions).toBe(false)
    expect(result.current.mentionQuery).toBe('')
  })

  it('filters suggestions by name', () => {
    const { result } = renderHook(() => useMentions(roomUsers))

    act(() => {
      result.current.checkForMentions('Hello @b', 9)
    })

    expect(result.current.mentionSuggestions).toHaveLength(1)
    expect(result.current.mentionSuggestions[0].name).toBe('Bob')
  })

  it('filters suggestions by email', () => {
    const { result } = renderHook(() => useMentions(roomUsers))

    act(() => {
      result.current.checkForMentions('Hello @bob', 10)
    })

    expect(result.current.mentionSuggestions).toHaveLength(1)
    expect(result.current.mentionSuggestions[0].name).toBe('Bob')
  })

  it('limits suggestions to MAX_MENTION_SUGGESTIONS', () => {
    const manyUsers = Array.from({ length: 20 }, (_, i) =>
      createUser(i + 1, `User${i + 1}`, `user${i + 1}@test.com`)
    )
    const { result } = renderHook(() => useMentions(manyUsers))

    act(() => {
      result.current.checkForMentions('Hello @u', 10)
    })

    // MAX_MENTION_SUGGESTIONS is 5
    expect(result.current.mentionSuggestions.length).toBeLessThanOrEqual(5)
  })

  it('inserts mention into message', () => {
    const { result } = renderHook(() => useMentions(roomUsers))
    let message = 'Hello @ali'
    const setMessage = (newMsg: string) => {
      message = newMsg
    }

    act(() => {
      result.current.checkForMentions(message, 10)
    })

    const insertResult = result.current.insertMention(
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      message,
      setMessage
    )

    expect(message).toContain('@Alice ')
    expect(insertResult.newCursorPos).toBeGreaterThan(0)
  })

  it('resets selected index when new suggestions appear', () => {
    const { result } = renderHook(() => useMentions(roomUsers))

    act(() => {
      result.current.checkForMentions('@ali', 4)
    })
    expect(result.current.selectedMentionIndex).toBe(0)

    // Navigate down
    act(() => {
      result.current.handleMentionNavigation('ArrowDown')
    })
    expect(result.current.selectedMentionIndex).toBe(0) // Only 1 suggestion, wraps to 0

    // New query with 2 suggestions
    act(() => {
      result.current.checkForMentions('@', 1)
    })
    expect(result.current.selectedMentionIndex).toBe(0)
  })

  it('navigates through suggestions with ArrowDown and ArrowUp', () => {
    const { result } = renderHook(() => useMentions(roomUsers))

    act(() => {
      result.current.checkForMentions('@', 1)
    })
    expect(result.current.mentionSuggestions.length).toBeGreaterThan(1)

    act(() => {
      result.current.handleMentionNavigation('ArrowDown')
    })
    expect(result.current.selectedMentionIndex).toBe(1)

    act(() => {
      result.current.handleMentionNavigation('ArrowDown')
    })
    expect(result.current.selectedMentionIndex).toBe(2)

    act(() => {
      result.current.handleMentionNavigation('ArrowUp')
    })
    expect(result.current.selectedMentionIndex).toBe(1)
  })

  it('hides suggestions on Escape', () => {
    const { result } = renderHook(() => useMentions(roomUsers))

    act(() => {
      result.current.checkForMentions('@ali', 4)
    })
    expect(result.current.showMentions).toBe(true)

    act(() => {
      result.current.handleMentionNavigation('Escape')
    })
    expect(result.current.showMentions).toBe(false)
  })

  it('returns false for non-navigation keys', () => {
    const { result } = renderHook(() => useMentions(roomUsers))

    act(() => {
      result.current.checkForMentions('@ali', 4)
    })

    const navResult = result.current.handleMentionNavigation('a')
    expect(navResult).toBe(false)
  })
})
