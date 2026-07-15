/**
 * 时区到语言的映射配置
 */

import { type SupportedLanguage } from './translations'

/**
 * 时区到语言的映射表
 */
export const TIMEZONE_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  // 亚洲时区
  'Asia/Shanghai': 'zh-CN',
  'Asia/Hong_Kong': 'zh-CN',
  'Asia/Chongqing': 'zh-CN',
  'Asia/Urumqi': 'zh-CN',
  'Asia/Taipei': 'zh-CN',
  'Asia/Seoul': 'en',

  // 美洲时区
  'America/New_York': 'en',
  'America/Los_Angeles': 'en',
  'America/Chicago': 'en',
  'America/Denver': 'en',
  'America/Toronto': 'en',
  'America/Vancouver': 'en',

  // 欧洲时区
  'Europe/London': 'en',
  'Europe/Paris': 'en',
  'Europe/Berlin': 'en',
  'Europe/Rome': 'en',
  'Europe/Madrid': 'en',
  'Europe/Amsterdam': 'en',

  // 大洋洲时区
  'Australia/Sydney': 'en',
  'Australia/Melbourne': 'en',
  'Pacific/Auckland': 'en',
}

/**
 * 根据时区获取推荐语言
 */
export function getLanguageFromTimezone(timezone: string): SupportedLanguage | null {
  return TIMEZONE_LANGUAGE_MAP[timezone] || null
}

/**
 * 获取所有支持的时区列表
 */
export function getSupportedTimezones(): string[] {
  return Object.keys(TIMEZONE_LANGUAGE_MAP)
}
