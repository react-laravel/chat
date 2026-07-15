/**
 * 浏览器语言处理工具
 */

import { type SupportedLanguage, SUPPORTED_LANGUAGES } from './translations'

/**
 * 支持的语言代码前缀映射
 */
const LANGUAGE_PREFIX_MAP: Record<string, SupportedLanguage> = {
  en: 'en',
  zh: 'zh-CN',
}

/**
 * 检查是否是支持的语言
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some(l => l.code === lang)
}

/**
 * 根据语言代码前缀获取支持的语言
 */
export function getSupportedLanguagesByPrefix(
  prefix: string
): Array<{ code: SupportedLanguage; name: string }> {
  const matchedLang = LANGUAGE_PREFIX_MAP[prefix.toLowerCase()]
  if (matchedLang) {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === matchedLang)
    if (langInfo) {
      return [{ code: langInfo.code, name: langInfo.name }]
    }
  }
  return []
}

/**
 * 规范化语言代码
 */
export function normalizeLanguageCode(lang: string): SupportedLanguage | null {
  // 直接匹配
  if (isSupportedLanguage(lang)) {
    return lang
  }

  // 处理如 "zh-CN" -> "zh_CN" 或反之
  const normalized = lang.replace('-', '_').replace('_', '-')
  if (isSupportedLanguage(normalized)) {
    return normalized
  }

  // 处理只有语言代码的情况
  const prefix = lang.split('-')[0].split('_')[0]
  if (prefix && LANGUAGE_PREFIX_MAP[prefix]) {
    return LANGUAGE_PREFIX_MAP[prefix]
  }

  return null
}

/**
 * 从浏览器语言列表检测最佳语言
 */
export function detectLanguageFromBrowser(
  browserLanguages: string[]
): { language: SupportedLanguage; confidence: number } | null {
  for (const browserLang of browserLanguages) {
    // 直接匹配
    if (isSupportedLanguage(browserLang)) {
      return { language: browserLang, confidence: 0.95 }
    }

    // 语言代码前缀匹配
    const [langCode, region] = browserLang.split('-', 2)
    const matchingLangs = getSupportedLanguagesByPrefix(langCode)

    if (matchingLangs.length > 0) {
      let confidence = 0.8

      // 地区完全匹配置信度更高
      if (region) {
        const exactMatch = matchingLangs.find(
          lang => lang.code.toLowerCase() === browserLang.toLowerCase()
        )
        if (exactMatch) {
          confidence = 0.9
          return { language: exactMatch.code, confidence }
        }
      }

      return { language: matchingLangs[0].code, confidence }
    }
  }

  return null
}
