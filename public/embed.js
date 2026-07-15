;(function () {
  'use strict'

  var script = document.currentScript
  if (!script) return

  var client = script.getAttribute('data-client')
  if (!client || !/^[a-z0-9][a-z0-9-]*$/.test(client)) {
    throw new Error('DogeOW Chat: data-client is required')
  }

  var mode = script.getAttribute('data-mode') || 'inline'
  var targetSelector = script.getAttribute('data-target')
  var target = targetSelector ? document.querySelector(targetSelector) : null
  var frame = document.createElement('iframe')
  var source = new URL('/embed', script.src)
  source.searchParams.set('client', client)

  frame.src = source.href
  frame.title = script.getAttribute('data-title') || 'DogeOW Chat'
  frame.loading = 'lazy'
  frame.allow = 'clipboard-write'
  frame.setAttribute(
    'sandbox',
    'allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts'
  )
  frame.style.border = '0'
  frame.style.colorScheme = 'light dark'

  if (mode === 'floating') {
    frame.style.position = 'fixed'
    frame.style.right = '20px'
    frame.style.bottom = '20px'
    frame.style.width = script.getAttribute('data-width') || 'min(420px, calc(100vw - 40px))'
    frame.style.height = script.getAttribute('data-height') || 'min(680px, calc(100vh - 40px))'
    frame.style.zIndex = script.getAttribute('data-z-index') || '2147483000'
    frame.style.borderRadius = '14px'
    frame.style.boxShadow = '0 20px 60px rgba(0,0,0,.28)'
  } else {
    frame.style.display = 'block'
    frame.style.width = script.getAttribute('data-width') || '100%'
    frame.style.height = script.getAttribute('data-height') || '680px'
  }

  ;(target || script.parentNode).insertBefore(frame, target ? null : script.nextSibling)
})()
