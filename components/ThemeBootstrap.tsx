'use client'

import { useEffect } from 'react'

export function ThemeBootstrap() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const params = new URLSearchParams(window.location.search)
    const requested = window.location.pathname === '/embed' ? params.get('theme') : 'system'
    const apply = () => {
      const dark = requested === 'dark' || (requested !== 'light' && media.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    if (window.location.pathname === '/embed') {
      const accent = params.get('accent')
      if (accent && /^#[0-9a-f]{6}$/i.test(accent)) {
        document.documentElement.style.setProperty('--primary', accent)
        const rgb = [1, 3, 5].map(index => parseInt(accent.slice(index, index + 2), 16) / 255)
        const linear = rgb.map(value =>
          value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        )
        const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
        document.documentElement.style.setProperty(
          '--primary-foreground',
          luminance > 0.179 ? '#171717' : '#ffffff'
        )
      }
    }
    return () => media.removeEventListener('change', apply)
  }, [])
  return null
}
