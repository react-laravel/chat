import { beforeEach, afterEach, it, expect, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ token: null as string | null, instances: [] as Array<any> }))
vi.mock('@/lib/utils/storage', () => ({ getAuthTokenFromStorage: () => mocks.token }))
vi.mock('../connection-monitor', () => ({
  getConnectionMonitor: () => ({ initializeWithEcho: vi.fn() }),
}))
vi.mock('laravel-echo', () => ({
  default: class {
    connector = { pusher: { connection: { state: 'connected', bind: vi.fn(), unbind: vi.fn() } } }
    connect = vi.fn()
    disconnect = vi.fn()
    constructor() {
      mocks.instances.push(this)
    }
  },
}))
import { createEchoInstance, destroyEchoInstance } from '../echo'
beforeEach(() => {
  vi.useFakeTimers()
  destroyEchoInstance(true)
  mocks.instances.length = 0
  mocks.token = null
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  destroyEchoInstance(true)
  vi.useRealTimers()
  vi.restoreAllMocks()
})
it('reuses a cookie-authenticated connection after a cancelled teardown', () => {
  const first = createEchoInstance()
  destroyEchoInstance(false)
  expect(createEchoInstance()).toBe(first)
  vi.advanceTimersByTime(1000)
  expect(mocks.instances).toHaveLength(1)
  expect(first?.disconnect).not.toHaveBeenCalled()
})
it('closes the old token connection without a timer destroying the replacement', () => {
  mocks.token = 'first-account-token'
  const first = createEchoInstance()
  mocks.token = 'second-account-token'
  const next = createEchoInstance()
  expect(next).not.toBe(first)
  expect(first?.disconnect).toHaveBeenCalledOnce()
  vi.advanceTimersByTime(1000)
  expect(next?.disconnect).not.toHaveBeenCalled()
})
