export { zh_CN } from './zh_CN'
export { en } from './en'

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']
