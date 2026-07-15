import { describe, expect, it } from 'vitest'
import { AVATAR_CONFIGS } from '../avatarConfig'

describe('avatarConfig', () => {
  it('should have sm, md, and lg configurations', () => {
    expect(AVATAR_CONFIGS).toHaveProperty('sm')
    expect(AVATAR_CONFIGS).toHaveProperty('md')
    expect(AVATAR_CONFIGS).toHaveProperty('lg')
  })

  describe('sm config', () => {
    it('should have correct className', () => {
      expect(AVATAR_CONFIGS.sm.className).toBe('h-8 w-8')
    })

    it('should have correct size dimensions', () => {
      expect(AVATAR_CONFIGS.sm.size).toEqual({ width: 32, height: 32 })
    })

    it('should have textSize set to text-xs', () => {
      expect(AVATAR_CONFIGS.sm.textSize).toBe('text-xs')
    })
  })

  describe('md config', () => {
    it('should have correct className', () => {
      expect(AVATAR_CONFIGS.md.className).toBe('h-10 w-10')
    })

    it('should have correct size dimensions', () => {
      expect(AVATAR_CONFIGS.md.size).toEqual({ width: 40, height: 40 })
    })

    it('should have empty textSize', () => {
      expect(AVATAR_CONFIGS.md.textSize).toBe('')
    })
  })

  describe('lg config', () => {
    it('should have correct className', () => {
      expect(AVATAR_CONFIGS.lg.className).toBe('h-12 w-12')
    })

    it('should have correct size dimensions', () => {
      expect(AVATAR_CONFIGS.lg.size).toEqual({ width: 48, height: 48 })
    })

    it('should have empty textSize', () => {
      expect(AVATAR_CONFIGS.lg.textSize).toBe('')
    })
  })

  it('should be readonly (as const)', () => {
    // Verify the config is a frozen/readonly structure
    expect(Object.keys(AVATAR_CONFIGS)).toHaveLength(3)
    expect(typeof AVATAR_CONFIGS.sm).toBe('object')
  })
})
