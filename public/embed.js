;(function () {
  'use strict'
  var script = document.currentScript
  if (!script) return
  var client = script.getAttribute('data-client')
  if (!client || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(client))
    throw new Error('DogeOW Chat: valid data-client is required')
  var mode = script.getAttribute('data-mode') || 'inline'
  var title = script.getAttribute('data-title') || 'DogeOW Chat'
  var accent = script.getAttribute('data-accent') || '#ff9d18'
  if (!/^#[a-f0-9]{6}$/i.test(accent)) accent = '#ff9d18'
  var source = new URL('/embed', script.src)
  source.searchParams.set('client', client)
  var room = script.getAttribute('data-room')
  if (room && /^[1-9]\d*$/.test(room)) source.searchParams.set('room', room)
  var theme = script.getAttribute('data-theme') || 'system'
  if (['light', 'dark', 'system'].indexOf(theme) !== -1) source.searchParams.set('theme', theme)
  source.searchParams.set('accent', accent)

  function mount() {
    var selector = script.getAttribute('data-target')
    var target = selector ? document.querySelector(selector) : null
    if (selector && !target && mode !== 'floating')
      throw new Error('DogeOW Chat: data-target was not found')
    var frame = document.createElement('iframe')
    frame.src = source.href
    frame.title = title
    frame.loading = mode === 'floating' ? 'eager' : 'lazy'
    frame.referrerPolicy = 'origin'
    frame.allow = 'clipboard-write'
    frame.setAttribute(
      'sandbox',
      'allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads'
    )
    frame.style.cssText = 'display:block;border:0;width:100%;min-height:0;color-scheme:light dark;'
    var open = mode !== 'floating'
    var root = null
    var launcher = null
    var badge = null
    var ready = false
    var intersecting = true
    function announceVisibility() {
      if (ready && frame.contentWindow)
        frame.contentWindow.postMessage(
          {
            type: 'dogeow-chat-visibility',
            client: client,
            visible: open && intersecting && document.visibilityState !== 'hidden',
          },
          source.origin
        )
    }
    function toggle(value) {
      open = value
      if (root) root.style.display = open ? 'flex' : 'none'
      if (launcher) {
        launcher.setAttribute('aria-expanded', String(open))
        launcher.style.display = open ? 'none' : 'flex'
      }
      announceVisibility()
      if (!open && launcher) launcher.focus()
    }
    if (mode === 'floating') {
      var z = Math.min(
        2147483600,
        Math.max(1, parseInt(script.getAttribute('data-z-index'), 10) || 2147483000)
      )
      root = document.createElement('section')
      root.setAttribute('aria-label', title)
      root.style.cssText =
        'display:none;position:fixed;right:20px;bottom:20px;flex-direction:column;overflow:hidden;border:1px solid rgba(0,0,0,.1);border-radius:16px;background:#fff;box-shadow:0 18px 70px rgba(0,0,0,.2);max-width:calc(100vw - 40px);'
      root.style.width = script.getAttribute('data-width') || '420px'
      root.style.height = script.getAttribute('data-height') || '680px'
      root.style.zIndex = String(z)
      var header = document.createElement('div')
      header.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 10px 0 16px;box-sizing:border-box;font:600 14px system-ui,sans-serif;background:#fff;color:#171717;border-bottom:1px solid #eee;'
      var label = document.createElement('span')
      label.textContent = title
      var close = document.createElement('button')
      close.type = 'button'
      close.textContent = '×'
      close.setAttribute('aria-label', '关闭聊天')
      close.style.cssText =
        'width:34px;height:34px;border:0;border-radius:8px;background:transparent;font:24px system-ui;cursor:pointer;color:#555;'
      close.addEventListener('click', function () {
        toggle(false)
      })
      var dark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      if (dark) {
        root.style.background = '#171717'
        header.style.background = '#171717'
        header.style.color = '#f5f5f5'
        header.style.borderColor = '#333'
        close.style.color = '#ddd'
      }
      header.appendChild(label)
      header.appendChild(close)
      root.appendChild(header)
      frame.style.height = '0'
      frame.style.flex = '1'
      root.appendChild(frame)
      launcher = document.createElement('button')
      launcher.type = 'button'
      launcher.setAttribute('aria-label', '打开聊天')
      launcher.setAttribute('aria-expanded', 'false')
      launcher.style.cssText =
        'position:fixed;right:20px;bottom:20px;display:flex;align-items:center;gap:8px;min-height:48px;padding:0 18px;border:0;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.18);font:600 14px system-ui,sans-serif;cursor:pointer;color:#171717;'
      var channels = [1, 3, 5].map(function (index) {
        var v = parseInt(accent.slice(index, index + 2), 16) / 255
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      })
      launcher.style.color =
        channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.179
          ? '#171717'
          : '#fff'
      launcher.style.background = accent
      launcher.style.zIndex = String(z + 1)
      launcher.textContent = script.getAttribute('data-label') || '打开聊天'
      badge = document.createElement('span')
      badge.hidden = true
      badge.style.cssText =
        'padding:2px 6px;border-radius:99px;background:#171717;color:white;font-size:11px;'
      launcher.appendChild(badge)
      launcher.addEventListener('click', function () {
        toggle(!open)
      })
      document.body.appendChild(root)
      document.body.appendChild(launcher)
      var resize = function () {
        var viewport = window.visualViewport
        var height = viewport ? viewport.height : window.innerHeight
        var inset = viewport ? Math.max(0, window.innerHeight - height - viewport.offsetTop) : 0
        root.style.maxHeight = Math.max(180, height - 40) + 'px'
        root.style.bottom = 20 + inset + 'px'
        launcher.style.bottom = 20 + inset + 'px'
      }
      resize()
      window.addEventListener('resize', resize)
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', resize)
        window.visualViewport.addEventListener('scroll', resize)
      }
    } else {
      frame.style.width = script.getAttribute('data-width') || '100%'
      frame.style.height = script.getAttribute('data-height') || '680px'
      if (target) target.appendChild(frame)
      else script.parentNode.insertBefore(frame, script.nextSibling)
    }
    window.addEventListener('message', function (event) {
      if (
        event.origin !== source.origin ||
        event.source !== frame.contentWindow ||
        event.data?.client !== client
      )
        return
      if (event.data.type === 'dogeow-chat-ready') {
        ready = true
        announceVisibility()
      }
      if (event.data.type === 'dogeow-chat-close' && mode === 'floating') toggle(false)
      if (event.data.type === 'dogeow-chat-unread' && badge) {
        var count = Math.max(0, Number(event.data.count) || 0)
        badge.textContent = count > 99 ? '99+' : String(count)
        badge.hidden = count === 0
      }
    })
    if ('IntersectionObserver' in window)
      new IntersectionObserver(
        function (entries) {
          intersecting = entries[0].intersectionRatio >= 0.9
          announceVisibility()
        },
        { threshold: [0, 0.9, 1] }
      ).observe(frame)
    document.addEventListener('visibilitychange', announceVisibility)
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', mount, { once: true })
  else mount()
})()
