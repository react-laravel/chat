import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMentions } from '../useMentions'

const createUser = (id: number, name: string, email: string) => ({
  id,
  name,
  email,
})

describe('useMentions', () => {
  const users = [
    createUser(1, 'Alice', 'alice@test.com'),
    createUser(2, 'Bob', 'bob@test.com'),
    createUser(3, 'Charlie', 'charlie@test.com'),
    createUser(4, 'David', 'david@test.com'),
    createUser(5, 'Eve', 'eve@test.com'),
  ]

  describe('initial state', () => {
    it('should have showMentions false', () => {
      const { result } = renderHook(() => useMentions(users))
      expect(result.current.showMentions).toBe(false)
    })

    it('should have selectedMentionIndex 0', () => {
      const { result } = renderHook(() => useMentions(users))
      expect(result.current.selectedMentionIndex).toBe(0)
    })

    it('should have empty mentionSuggestions', () => {
      const { result } = renderHook(() => useMentions(users))
      expect(result.current.mentionSuggestions).toEqual([])
    })
  })

  describe('checkForMentions', () => {
    it('should show mentions when @ is typed', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @', 7)
      })

      expect(result.current.showMentions).toBe(true)
    })

    it('should filter suggestions by name', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @ali', 10)
      })

      expect(result.current.mentionSuggestions).toHaveLength(1)
      expect(result.current.mentionSuggestions[0].name).toBe('Alice')
    })

    it('should filter suggestions by email', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @bob', 10)
      })

      expect(result.current.mentionSuggestions).toHaveLength(1)
      expect(result.current.mentionSuggestions[0].name).toBe('Bob')
    })

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @ALICE', 10)
      })

      expect(result.current.mentionSuggestions).toHaveLength(1)
      expect(result.current.mentionSuggestions[0].name).toBe('Alice')
    })

    it('should hide mentions when no @ match', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello world', 11)
      })

      expect(result.current.showMentions).toBe(false)
    })

    it('should return empty suggestions for whitespace after @', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @   ', 11)
      })

      expect(result.current.mentionSuggestions).toEqual([])
    })

    it('should reset selectedMentionIndex to 0 on new search', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @ali', 10)
      })
      expect(result.current.selectedMentionIndex).toBe(0)
    })

    it('should limit suggestions to MAX_MENTION_SUGGESTIONS', () => {
      const manyUsers = Array.from({ length: 20 }, (_, i) =>
        createUser(i + 1, `User${i + 1}`, `user${i + 1}@test.com`)
      )
      const { result } = renderHook(() => useMentions(manyUsers))

      act(() => {
        result.current.checkForMentions('Hello @u', 10)
      })

      // MAX_MENTION_SUGGESTIONS = 5
      expect(result.current.mentionSuggestions.length).toBeLessThanOrEqual(5)
    })
  })

  describe('insertMention', () => {
    it('should insert mention into message', () => {
      const { result } = renderHook(() => useMentions(users))
      let message = 'Hello @ali'
      const setMessage = (newMsg: string) => {
        message = newMsg
      }

      act(() => {
        result.current.checkForMentions(message, 10)
      })

      const { newMessage } = result.current.insertMention(
        { id: 1, name: 'Alice', email: 'alice@test.com' },
        message,
        setMessage
      )

      expect(newMessage).toBe('Hello @Alice ')
      expect(message).toBe('Hello @Alice ')
    })

    it('should return correct cursor position', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @ali', 10)
      })

      const { newCursorPos } = result.current.insertMention(
        { id: 1, name: 'Alice', email: 'alice@test.com' },
        'Hello @ali',
        () => {}
      )

      // beforeMention.length (6) + name.length (5) + 2 (@ and space) = 13
      expect(newCursorPos).toBe(13)
    })

    it('should hide mentions after insertion', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @ali', 10)
      })
      expect(result.current.showMentions).toBe(true)

      act(() => {
        result.current.insertMention(
          { id: 1, name: 'Alice', email: 'alice@test.com' },
          'Hello @ali',
          () => {}
        )
      })

      expect(result.current.showMentions).toBe(false)
    })
  })

  describe('handleMentionNavigation', () => {
    it('should return false when showMentions is false', () => {
      const { result } = renderHook(() => useMentions(users))

      const handled = result.current.handleMentionNavigation('ArrowDown')
      expect(handled).toBe(false)
    })

    it('should return false when no suggestions', () => {
      const { result } = renderHook(() => useMentions([]))

      act(() => {
        result.current.checkForMentions('Hello @', 7)
      })

      const handled = result.current.handleMentionNavigation('ArrowDown')
      expect(handled).toBe(false)
    })

    it('should navigate down through suggestions', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @a', 10)
      })

      expect(result.current.selectedMentionIndex).toBe(0)

      act(() => {
        result.current.handleMentionNavigation('ArrowDown')
      })
      expect(result.current.selectedMentionIndex).toBe(1)

      act(() => {
        result.current.handleMentionNavigation('ArrowDown')
      })
      expect(result.current.selectedMentionIndex).toBe(2)
    })

    it('should wrap around when navigating down past last item', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @a', 10)
      })

      // Navigate to the last item (index 4 for 5 users starting with 'a')
      const count = result.current.mentionSuggestions.length
      for (let i = 0; i < count; i++) {
        act(() => {
          result.current.handleMentionNavigation('ArrowDown')
        })
      }

      // Should wrap back to 0
      expect(result.current.selectedMentionIndex).toBe(0)
    })

    it('should navigate up through suggestions', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @a', 10)
      })

      act(() => {
        result.current.handleMentionNavigation('ArrowDown')
      })
      expect(result.current.selectedMentionIndex).toBe(1)

      act(() => {
        result.current.handleMentionNavigation('ArrowUp')
      })
      expect(result.current.selectedMentionIndex).toBe(0)
    })

    it('should wrap around when navigating up past first item', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @a', 10)
      })

      act(() => {
        result.current.handleMentionNavigation('ArrowUp')
      })

      // Should wrap to last suggestion
      const suggestions = result.current.mentionSuggestions
      expect(result.current.selectedMentionIndex).toBe(suggestions.length - 1)
    })

    it('should hide mentions on Escape', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @ali', 10)
      })
      expect(result.current.showMentions).toBe(true)

      act(() => {
        result.current.handleMentionNavigation('Escape')
      })
      expect(result.current.showMentions).toBe(false)
    })

    it('should return true for Escape', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @ali', 10)
      })

      const handled = result.current.handleMentionNavigation('Escape')
      expect(handled).toBe(true)
    })

    it('should return false for unhandled keys', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.checkForMentions('Hello @ali', 10)
      })

      expect(result.current.handleMentionNavigation('Enter')).toBe(false)
      expect(result.current.handleMentionNavigation('Tab')).toBe(false)
    })
  })

  describe('setShowMentions', () => {
    it('should allow manually controlling showMentions', () => {
      const { result } = renderHook(() => useMentions(users))

      act(() => {
        result.current.setShowMentions(true)
      })
      expect(result.current.showMentions).toBe(true)

      act(() => {
        result.current.setShowMentions(false)
      })
      expect(result.current.showMentions).toBe(false)
    })
  })
})
