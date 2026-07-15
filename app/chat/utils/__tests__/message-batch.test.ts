import { describe, it, expect, vi, afterEach } from 'vitest'
import { MessageBatchProcessor, mergeUpdates } from '../message-batch'

describe('MessageBatchProcessor', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add updates and flush after delay', async () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const processor = new MessageBatchProcessor(callback, 50)

    processor.addUpdate('type1', { roomId: '1' })
    expect(processor.getPendingCount()).toBe(1)

    processor.addUpdate('type2', { roomId: '2' })
    expect(processor.getPendingCount()).toBe(2)

    await vi.advanceTimersByTimeAsync(50)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith([
      { type: 'type1', data: { roomId: '1' }, timestamp: expect.any(Number) },
      { type: 'type2', data: { roomId: '2' }, timestamp: expect.any(Number) },
    ])
    expect(processor.getPendingCount()).toBe(0)
  })

  it('should batch rapid updates within the delay window', async () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const processor = new MessageBatchProcessor(callback, 100)

    processor.addUpdate('type1', { roomId: '1' })
    // Add another update before the timer fires
    await vi.advanceTimersByTimeAsync(30)
    processor.addUpdate('type2', { roomId: '1' })
    await vi.advanceTimersByTimeAsync(30)
    processor.addUpdate('type3', { roomId: '2' })

    // All 3 should be batched together
    await vi.advanceTimersByTimeAsync(100)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0]).toHaveLength(3)
  })

  it('should flush immediately', async () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const processor = new MessageBatchProcessor(callback, 1000)

    processor.addUpdate('type1', { roomId: '1' })
    processor.flush()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith([
      { type: 'type1', data: { roomId: '1' }, timestamp: expect.any(Number) },
    ])
    expect(processor.getPendingCount()).toBe(0)
  })

  it('should clear all pending updates', async () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const processor = new MessageBatchProcessor(callback, 1000)

    processor.addUpdate('type1', { roomId: '1' })
    processor.addUpdate('type2', { roomId: '2' })
    expect(processor.getPendingCount()).toBe(2)

    processor.clear()
    expect(processor.getPendingCount()).toBe(0)

    await vi.advanceTimersByTimeAsync(1000)
    expect(callback).not.toHaveBeenCalled()
  })

  it('should not flush when there are no updates', async () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const processor = new MessageBatchProcessor(callback, 50)

    processor.flush()
    expect(callback).not.toHaveBeenCalled()
  })

  it('should return 0 pending count when empty', () => {
    const processor = new MessageBatchProcessor(vi.fn(), 50)
    expect(processor.getPendingCount()).toBe(0)
  })
})

describe('mergeUpdates', () => {
  it('should merge updates with same type and roomId', () => {
    const updates = [
      { type: 'message', data: { roomId: '1' }, timestamp: 100 },
      { type: 'message', data: { roomId: '1' }, timestamp: 200 },
    ]

    const merged = mergeUpdates(updates)
    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual(updates[1]) // keeps the later one
  })

  it('should keep updates with different types', () => {
    const updates = [
      { type: 'message', data: { roomId: '1' }, timestamp: 100 },
      { type: 'typing', data: { roomId: '1' }, timestamp: 200 },
    ]

    const merged = mergeUpdates(updates)
    expect(merged).toHaveLength(2)
  })

  it('should keep updates with different roomIds', () => {
    const updates = [
      { type: 'message', data: { roomId: '1' }, timestamp: 100 },
      { type: 'message', data: { roomId: '2' }, timestamp: 200 },
    ]

    const merged = mergeUpdates(updates)
    expect(merged).toHaveLength(2)
  })

  it('should handle missing roomId in data', () => {
    const updates = [
      { type: 'message', data: {}, timestamp: 100 },
      { type: 'message', data: {}, timestamp: 200 },
    ]

    const merged = mergeUpdates(updates)
    expect(merged).toHaveLength(1)
  })

  it('should return empty array for empty input', () => {
    expect(mergeUpdates([])).toEqual([])
  })
})
