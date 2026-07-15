import { zh_CN, en } from './langs'

export interface Translations {
  [languageCode: string]: {
    [key: string]: string
  }
}

export const translations: Translations = {
  'zh-CN': zh_CN,
  en: en,
}

export { SUPPORTED_LANGUAGES, type SupportedLanguage } from './langs'
