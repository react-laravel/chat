/** Coalesce bursts and retain the latest request even while an async call is in flight. */
export const createThrottledFunction = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T => {
  const { leading = true, trailing = true } = options
  let running = false
  let lastStarted = -Infinity
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: Parameters<T> | null = null

  const schedule = () => {
    if (!trailing || running || timer || !pendingArgs) return
    timer = setTimeout(
      () => {
        timer = null
        if (!pendingArgs || running) return
        const result = invoke(pendingArgs)
        if (result instanceof Promise) void result.catch(() => {})
      },
      Math.max(0, delay - (Date.now() - lastStarted))
    )
  }
  const invoke = (args: Parameters<T>) => {
    pendingArgs = null
    running = true
    lastStarted = Date.now()
    const finish = () => {
      running = false
      schedule()
    }
    try {
      const result = fn(...args)
      if (result instanceof Promise) return result.finally(finish)
      finish()
      return result
    } catch (error) {
      finish()
      throw error
    }
  }
  return ((...args: Parameters<T>) => {
    if (!running && Date.now() - lastStarted >= delay && leading) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      return invoke(args)
    }
    pendingArgs = args
    if (!leading && lastStarted === -Infinity) lastStarted = Date.now()
    schedule()
    return Promise.resolve()
  }) as T
}
