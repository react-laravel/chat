/**
 * 地理位置语言检测
 */
import type { SupportedLanguage } from './translations'
import type { LanguageDetectionResult } from './language-detection-service'
import { getLanguageFromTimezone } from './timezone-map'

const GEO_CACHE_KEY = 'dogeow-geo-language'
const GEO_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时

export interface GeolocationData {
  country: string
  region: string
  city: string
  timezone: string
  language?: string
}

export class GeolocationDetector {
  /**
   * 通过时区检测语言
   */
  detectByTimezone(): LanguageDetectionResult | null {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!timezone) return null

      const geoLanguage = getLanguageFromTimezone(timezone)
      if (!geoLanguage) return null

      return {
        language: geoLanguage,
        confidence: 0.75,
        method: 'geolocation',
        timestamp: Date.now(),
      }
    } catch {
      return null
    }
  }

  /**
   * 获取缓存的地理位置数据
   */
  getCachedGeolocationData(): LanguageDetectionResult | null {
    try {
      if (typeof window === 'undefined') return null
      const cachedGeoData = window.localStorage.getItem(GEO_CACHE_KEY)
      if (!cachedGeoData) return null

      const parsed = JSON.parse(cachedGeoData)
      if (Date.now() - parsed.timestamp < GEO_CACHE_DURATION) {
        return {
          language: parsed.language,
          confidence: 0.75,
          method: 'geolocation',
          timestamp: Date.now(),
        }
      }
    } catch {
      // ignore parse errors
    }
    return null
  }

  /**
   * 缓存地理位置数据
   */
  cacheGeolocationData(language: SupportedLanguage): void {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(
        GEO_CACHE_KEY,
        JSON.stringify({ language, timestamp: Date.now() })
      )
    } catch {
      // ignore storage errors
    }
  }

  /**
   * 清除地理位置缓存
   */
  clearCache(): void {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.removeItem(GEO_CACHE_KEY)
    } catch {
      // ignore
    }
  }

  /**
   * 通过IP地理位置检测语言
   * 占位实现，可集成 ipapi.co / ipinfo.io / ip-api.com
   */
  async detectByIP(): Promise<LanguageDetectionResult | null> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeoutId)

      if (!response.ok) return null

      const data = (await response.json()) as { languages?: string; timezone?: string }
      const langCode = data.languages?.split(',')[0]
      if (!langCode) return null

      // 简单的语言代码规范化
      const normalized = this.normalizeLanguageCode(langCode)
      if (!normalized) return null

      return {
        language: normalized,
        confidence: 0.7,
        method: 'geolocation',
        timestamp: Date.now(),
      }
    } catch {
      return null
    }
  }

  private normalizeLanguageCode(code: string): SupportedLanguage | null {
    const map: Record<string, SupportedLanguage> = {
      zh: 'zh-CN',
      'zh-cn': 'zh-CN',
      'zh-tw': 'zh-CN',
      'zh-hk': 'zh-CN',
      en: 'en',
    }
    return map[code.toLowerCase()] ?? null
  }
}
