import { Form, Button, ButtonGroup } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { Globe } from 'lucide-react'

const locales = ['en', 'vi']

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
}

interface LocaleSwitcherProps {
  variant?: 'dropdown' | 'pills'
  className?: string
}

export default function LocaleSwitcher({
  variant = 'dropdown',
  className = '',
}: LocaleSwitcherProps) {
  const router = useRouter()
  const { i18n } = useTranslation()
  const current = i18n.language

  function switchLocale(locale: string) {
    if (locale === current) return
    i18n.changeLanguage(locale)
    void router.invalidate()
  }

  if (variant === 'pills') {
    return (
      <ButtonGroup size="sm" className={className}>
        {locales.map((lang) => (
          <Button
            key={lang}
            variant={lang === current ? 'primary' : 'outline-secondary'}
            onClick={() => switchLocale(lang)}
            className="rounded-pill mx-1"
          >
            {lang.toUpperCase()}
          </Button>
        ))}
      </ButtonGroup>
    )
  }

  return (
    <div className={`d-inline-flex align-items-center gap-1 ${className}`}>
      <Globe size={16} className="text-secondary" />
      <Form.Select
        size="sm"
        value={current}
        onChange={(e) => switchLocale(e.target.value)}
        className="border-0 bg-transparent shadow-none w-auto pe-4"
        aria-label="Select language"
        id="locale-switcher"
      >
        {locales.map((lang) => (
          <option key={lang} value={lang}>
            {LANG_LABELS[lang] ?? lang.toUpperCase()}
          </option>
        ))}
      </Form.Select>
    </div>
  )
}
