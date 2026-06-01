import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../../messages/en.json'
import vi from '../../messages/vi.json'

const resources = {
  en: { translation: en },
  vi: { translation: vi },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi'],
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })

export default i18n
