import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createThrottledFunction } from '../throttle'

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return a function', () => {
    const throttled = createThrottledFunction(() => {}, 100)
    expect(typeof throttled).toBe('function')
  })

  describe('basic timing', () => {
    it('should call function immediately on first call', () => {
      const fn = vi.fn()
      const throttled = createThrottledFunction(fn, 100)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should not call function again within delay period', () => {
      const fn = vi.fn()
      const throttled = createThrottledFunction(fn, 100)

      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should call function after delay period passes', () => {
      const fn = vi.fn()
      const throttled = createThrottledFunction(fn, 100)

      throttled() // first call
      vi.advanceTimersByTime(150) // past the delay
      throttled() // second call

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should throttle rapid successive calls', () => {
      const fn = vi.fn()
      const throttled = createThrottledFunction(fn, 100)

      throttled()
      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('arguments', () => {
    it('should pass arguments through to the wrapped function', () => {
      const fn = vi.fn()
      const throttled = createThrottledFunction(fn, 100)

      throttled('arg1', 'arg2', 123)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123)
    })

    it('should pass object arguments', () => {
      const fn = vi.fn()
      const throttled = createThrottledFunction(fn, 100)

      const obj = { key: 'value' }
      throttled(obj)

      expect(fn).toHaveBeenCalledWith(obj)
    })
  })

  describe('delay parameter', () => {
    it('should use custom delay', () => {
      const fn = vi.fn()
      const throttled = createThrottledFunction(fn, 200)

      throttled()
      vi.advanceTimersByTime(100)
      throttled() // within 200ms delay

      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(150) // now past 200ms total
      throttled()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('default options behavior', () => {
    it('should default to leading=true and trailing=true', () => {
      const fn = vi.fn()
      // Default options: { leading: true, trailing: true }
      const throttled = createThrottledFunction(fn, 100)

      // First call should fire immediately (leading)
      throttled()
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
