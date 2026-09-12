import { it, expect, vi } from 'vitest'
import { getConnectionMonitor, destroyConnectionMonitor } from '../connection-monitor'

it('binds once per connection and recognizes an already connected transport', () => {
  const connection = { state: 'connected', bind: vi.fn(), unbind: vi.fn() }
  const echo = { connector: { pusher: { connection } } }
  const monitor = getConnectionMonitor()
  monitor.initializeWithEcho(echo as never)
  const count = connection.bind.mock.calls.length
  monitor.initializeWithEcho(echo as never)
  expect(connection.bind).toHaveBeenCalledTimes(count)
  expect(monitor.getStatus().status).toBe('connected')
  destroyConnectionMonitor()
  expect(connection.unbind).toHaveBeenCalledTimes(count)
})
