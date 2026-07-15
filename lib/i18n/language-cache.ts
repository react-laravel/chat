/**
 * 语言检测缓存管理
 */
import type { SupportedLanguage } from './translations'
import type { LanguageDetectionResult, DetectionMethod } from './language-detection-service'

export const DETECTION_CONFIG = {
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24小时
  LOG_THROTTLE_MS: 2000, // 2秒内只输出一次日志
  GEO_CACHE_DURATION: 24 * 60 * 60 * 1000, // 地理位置缓存24小时
  DETECTION_TIMEOUT: 5000, // 检测超时时间
  POLLING_INTERVAL: 100, // 轮询间隔
} as const

export class LanguageDetectionCache {
  private cache: Map<string, LanguageDetectionResult> = new Map()

  get(key: string): LanguageDetectionResult | undefined {
    return this.cache.get(key)
  }

  set(key: string, result: LanguageDetectionResult): void {
    this.cache.set(key, result)
  }

  isCacheValid(cached: LanguageDetectionResult): boolean {
    return Date.now() - cached.timestamp < DETECTION_CONFIG.CACHE_DURATION
  }

  getCacheKey(options: { ignoreStoredPreference?: boolean }): string {
    return `language-detection:${options.ignoreStoredPreference ? 'no-pref' : 'with-pref'}`
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  getLastDetection(): number | undefined {
    return Array.from(this.cache.values()).sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp
  }
}

export const createDefaultResult = (
  method: DetectionMethod = 'default'
): LanguageDetectionResult => ({
  language: 'zh-CN',
  confidence: 0.5,
  method,
  timestamp: Date.now(),
})
