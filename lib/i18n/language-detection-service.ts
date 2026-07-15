/**
 * 语言检测服务 — 薄协调器
 * 使用多种策略检测用户首选语言，实现缓存和置信度评分
 */
import type { SupportedLanguage } from './translations'
import {
  detectLanguageFromBrowser,
  isSupportedLanguage,
  normalizeLanguageCode,
} from './browser-language-utils'
import { LanguageDetectionCache, DETECTION_CONFIG, createDefaultResult } from './language-cache'
import { GeolocationDetector } from './geolocation-detector'
import { BrowserLanguageStrategy } from './strategies/BrowserLanguageStrategy'
import { GeolocationStrategy } from './strategies/GeolocationStrategy'
import { StoredPreferenceStrategy } from './strategies/StoredPreferenceStrategy'

// ===== 导出类型 =====

export interface LanguageDetectionResult {
  language: SupportedLanguage
  confidence: number
  method: DetectionMethod
  timestamp: number
}

export interface LanguageDetectionOptions {
  ignoreStoredPreference?: boolean
}

export type DetectionMethod =
  | 'browser'
  | 'geolocation'
  | 'user_agent'
  | 'stored_preference'
  | 'default'

// ===== 置信度阈值 =====

export const CONFIDENCE_THRESHOLDS = {
  STORED_PREFERENCE: 1.0,
  BROWSER_HIGH: 0.8,
  BROWSER_MEDIUM: 0.6,
  GEOLOCATION: 0.7,
  USER_AGENT: 0.6,
  DEFAULT: 0.5,
} as const

// ===== 日志类型 =====

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface Logger {
  log(level: LogLevel, message: string, data?: unknown): void
  shouldLog(): boolean
}

// ===== 服务类 =====

export class LanguageDetectionService {
  private static instance: LanguageDetectionService
  private cache: LanguageDetectionCache
  private geoDetector: GeolocationDetector
  private browserStrategy: BrowserLanguageStrategy
  private geoStrategy: GeolocationStrategy
  private storedStrategy: StoredPreferenceStrategy
  private logger: Logger
  private detectionPromise: Promise<LanguageDetectionResult> | null = null

  private constructor() {
    this.cache = new LanguageDetectionCache()
    this.geoDetector = new GeolocationDetector()
    this.browserStrategy = new BrowserLanguageStrategy()
    this.geoStrategy = new GeolocationStrategy()
    this.storedStrategy = new StoredPreferenceStrategy()
    this.logger = this.createLogger()
  }

  static getInstance(): LanguageDetectionService {
    if (!LanguageDetectionService.instance) {
      LanguageDetectionService.instance = new LanguageDetectionService()
    }
    return LanguageDetectionService.instance
  }

  private createLogger(): Logger {
    let lastLogTime = 0
    return {
      log: (level: LogLevel, message: string, data?: unknown) => {
        const now = Date.now()
        if (now - lastLogTime < DETECTION_CONFIG.LOG_THROTTLE_MS && level === 'info') return
        const prefix = '[LanguageDetection]'
        const logMessage = `${prefix} ${message}`
        if (level === 'error') console.error(logMessage, data)
        else if (level === 'warn') console.warn(logMessage, data)
        else if (level === 'debug') console.debug(logMessage, data)
        else console.log(logMessage, data)
        if (level === 'info') lastLogTime = now
      },
      shouldLog: () => Date.now() - lastLogTime >= DETECTION_CONFIG.LOG_THROTTLE_MS,
    }
  }

  async detectLanguage(options: LanguageDetectionOptions = {}): Promise<LanguageDetectionResult> {
    const cacheKey = this.cache.getCacheKey(options)
    const cached = this.cache.get(cacheKey)
    if (cached && this.cache.isCacheValid(cached)) {
      this.logger.log('info', '使用缓存结果:', cached)
      return cached
    }

    if (this.detectionPromise) {
      this.logger.log('info', '检测正在进行中，等待...')
      return this.detectionPromise
    }

    this.detectionPromise = this.performDetectionWithTimeout(options)
    try {
      const result = await this.detectionPromise
      this.cache.set(cacheKey, result)
      this.logger.log('info', '检测完成:', result)
      return result
    } finally {
      this.detectionPromise = null
    }
  }

  private performDetectionWithTimeout(
    options: LanguageDetectionOptions
  ): Promise<LanguageDetectionResult> {
    const timeoutPromise = new Promise<LanguageDetectionResult>((_, reject) => {
      setTimeout(() => reject(new Error('语言检测超时')), DETECTION_CONFIG.DETECTION_TIMEOUT)
    })
    return Promise.race([this.performDetection(options), timeoutPromise])
  }

  private async performDetection(
    options: LanguageDetectionOptions
  ): Promise<LanguageDetectionResult> {
    this.logger.log('info', '开始语言检测...')

    const strategies: Array<{
      name: string
      method: () => LanguageDetectionResult | null
      threshold: number
    }> = [
      ...(!options.ignoreStoredPreference
        ? [
            {
              name: '已存储偏好',
              method: (): LanguageDetectionResult | null => {
                const r = this.storedStrategy.detect()
                if (!r) return null
                return { ...r, method: 'stored_preference', timestamp: Date.now() }
              },
              threshold: CONFIDENCE_THRESHOLDS.STORED_PREFERENCE,
            },
          ]
        : []),
      {
        name: '浏览器语言',
        method: (): LanguageDetectionResult | null => {
          const r = this.browserStrategy.detect()
          if (!r) return null
          return { ...r, method: 'browser', timestamp: Date.now() }
        },
        threshold: CONFIDENCE_THRESHOLDS.BROWSER_HIGH,
      },
      {
        name: '地理位置',
        method: () => this.detectByGeolocationThunk(),
        threshold: CONFIDENCE_THRESHOLDS.GEOLOCATION,
      },
      {
        name: 'User Agent',
        method: () => this.detectByUserAgent(),
        threshold: CONFIDENCE_THRESHOLDS.USER_AGENT,
      },
    ]

    for (const strategy of strategies) {
      try {
        this.logger.log('info', `尝试策略: ${strategy.name}`)
        const result = strategy.method()
        if (result && result.confidence >= strategy.threshold) {
          this.logger.log('info', `✅ ${strategy.name}检测成功:`, result)
          return result
        }
      } catch (error) {
        this.logger.log('warn', `❌ ${strategy.name}检测失败:`, error)
      }
    }

    this.logger.log('info', '使用默认回退策略')
    return createDefaultResult('default')
  }

  private detectByGeolocationThunk(): LanguageDetectionResult | null {
    if (typeof window === 'undefined') return null

    // 缓存的地理位置
    const cached = this.geoDetector.getCachedGeolocationData()
    if (cached) return cached

    // 时区检测
    const timezoneResult = this.geoDetector.detectByTimezone()
    if (timezoneResult) {
      this.geoDetector.cacheGeolocationData(timezoneResult.language)
      return timezoneResult
    }

    // IP 地理位置（异步）
    this.geoDetector
      .detectByIP()
      .then(ipResult => {
        if (ipResult) this.geoDetector.cacheGeolocationData(ipResult.language)
      })
      .catch(() => {})

    return null
  }

  private detectBrowserLanguage(): LanguageDetectionResult | null {
    if (typeof window === 'undefined') return null

    const browserLanguages = navigator.languages || [navigator.language]
    const result = detectLanguageFromBrowser([...browserLanguages])
    if (!result) return null

    return {
      ...result,
      method: 'browser',
      timestamp: Date.now(),
    }
  }

  private detectByGeolocation(): LanguageDetectionResult | null {
    const result = this.geoStrategy.detect()
    if (!result) return null

    return {
      ...result,
      method: 'geolocation',
      timestamp: Date.now(),
    }
  }

  private getStoredPreference(): SupportedLanguage | null {
    const result = this.storedStrategy.detect()
    return result?.language ?? null
  }

  private isSupportedLanguage(lang: string): lang is SupportedLanguage {
    return isSupportedLanguage(lang)
  }

  private normalizeLanguageCode(lang: string): SupportedLanguage | null {
    return normalizeLanguageCode(lang)
  }

  private detectByUserAgent(): LanguageDetectionResult {
    if (typeof window === 'undefined') return createDefaultResult('user_agent')

    const legacyLanguage =
      ('userLanguage' in navigator &&
        (navigator as Navigator & { userLanguage?: string }).userLanguage) ||
      ('systemLanguage' in navigator &&
        (navigator as Navigator & { systemLanguage?: string }).systemLanguage)

    if (legacyLanguage) {
      const language = normalizeLanguageCode(legacyLanguage)
      if (language) {
        return {
          language,
          confidence: CONFIDENCE_THRESHOLDS.USER_AGENT,
          method: 'user_agent',
          timestamp: Date.now(),
        }
      }
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const languagePatterns: Array<{ patterns: string[]; language: SupportedLanguage }> = [
      { patterns: ['zh-cn', 'zh_cn'], language: 'zh-CN' },
      { patterns: ['zh-tw', 'zh_tw'], language: 'zh-CN' },
      { patterns: ['en'], language: 'en' },
    ]

    for (const { patterns, language } of languagePatterns) {
      if (patterns.some(pattern => userAgent.includes(pattern))) {
        return {
          language,
          confidence: CONFIDENCE_THRESHOLDS.USER_AGENT,
          method: 'user_agent',
          timestamp: Date.now(),
        }
      }
    }

    return createDefaultResult('user_agent')
  }

  clearCache(): void {
    this.logger.log('info', '清除检测缓存')
    this.cache.clear()
    this.geoDetector.clearCache()
  }

  getDetectionStats() {
    return {
      cacheSize: this.cache.size,
      lastDetection: this.cache.getLastDetection(),
      hasActivePromise: this.detectionPromise !== null,
    }
  }

  async forceRedetect(options: LanguageDetectionOptions = {}): Promise<LanguageDetectionResult> {
    this.logger.log('info', '强制重新检测语言')
    this.clearCache()
    this.detectionPromise = null
    return this.detectLanguage(options)
  }
}

export const languageDetectionService = LanguageDetectionService.getInstance()
