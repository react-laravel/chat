import { describe, expect, it } from 'vitest'
import {
  MAX_MESSAGE_LENGTH,
  TYPING_TIMEOUT,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  MAX_MENTION_SUGGESTIONS,
  MAX_TEXTAREA_HEIGHT,
  DEBOUNCE_DELAY,
  COMMON_EMOJIS,
} from '../constants'

describe('message-input constants', () => {
  describe('numeric constants', () => {
    it('should have MAX_MESSAGE_LENGTH of 1000', () => {
      expect(MAX_MESSAGE_LENGTH).toBe(1000)
    })

    it('should have TYPING_TIMEOUT of 3000ms', () => {
      expect(TYPING_TIMEOUT).toBe(3000)
    })

    it('should have MAX_FILE_SIZE of 5MB', () => {
      expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024)
    })

    it('should have MAX_MENTION_SUGGESTIONS of 5', () => {
      expect(MAX_MENTION_SUGGESTIONS).toBe(5)
    })

    it('should have MAX_TEXTAREA_HEIGHT of 120', () => {
      expect(MAX_TEXTAREA_HEIGHT).toBe(120)
    })

    it('should have DEBOUNCE_DELAY of 1000ms', () => {
      expect(DEBOUNCE_DELAY).toBe(1000)
    })
  })

  describe('ALLOWED_IMAGE_TYPES', () => {
    it('should include jpeg', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg')
    })

    it('should include png', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png')
    })

    it('should include gif', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/gif')
    })

    it('should include webp', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/webp')
    })

    it('should have exactly 4 types', () => {
      expect(ALLOWED_IMAGE_TYPES).toHaveLength(4)
    })

    it('should not include video types', () => {
      expect(ALLOWED_IMAGE_TYPES).not.toContain('video/mp4')
    })
  })

  describe('COMMON_EMOJIS', () => {
    it('should have emojis', () => {
      expect(COMMON_EMOJIS.length).toBeGreaterThan(0)
    })

    it('should contain common emojis', () => {
      expect(COMMON_EMOJIS).toContain('😀')
      expect(COMMON_EMOJIS).toContain('👍')
      expect(COMMON_EMOJIS).toContain('❤️')
    })

    it('should be a readonly array', () => {
      // TypeScript const assertion ensures this is a readonly tuple
      expect(Array.isArray(COMMON_EMOJIS)).toBe(true)
    })
  })
})
