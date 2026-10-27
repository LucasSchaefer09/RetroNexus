import { Check, Grid2X2, List, Moon, Sun } from 'lucide-react'
import { translate } from './i18n'
import type { AppSettings } from './types'

type Props = {
  settings: AppSettings
  onChange: (settings: Partial<AppSettings>) => void
}

export function SettingsPage({ settings, onChange }: Props) {
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.language, key)
  return (
    <section className="settings-page">
      <p className="eyebrow">{t('appearanceEyebrow')}</p>
      <h1>{t('settings')}</h1>

      <section className="preferences-section" aria-labelledby="appearance-heading">
        <div className="preferences-heading">
          <div>
            <h2 id="appearance-heading">{t('appearance')}</h2>
            <p>{t('preferencesSaved')}</p>
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>{t('theme')}</h3><p>{t('themeDescription')}</p></div>
          <div className="choice-group">
            <button className={`choice-button ${settings.theme === 'dark' ? 'selected' : ''}`} aria-pressed={settings.theme === 'dark'} onClick={() => onChange({ theme: 'dark' })}>
              <Moon size={16} /> {t('dark')} {settings.theme === 'dark' && <Check size={14} />}
            </button>
            <button className={`choice-button ${settings.theme === 'light' ? 'selected' : ''}`} aria-pressed={settings.theme === 'light'} onClick={() => onChange({ theme: 'light' })}>
              <Sun size={16} /> {t('light')} {settings.theme === 'light' && <Check size={14} />}
            </button>
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>{t('accent')}</h3><p>{t('accentDescription')}</p></div>
          <div className="choice-group accent-choices" role="group" aria-label={t('accent')}>
            {([
              ['purple', 'purple', '#713bff'],
              ['cyan', 'cyan', '#31e6e0'],
              ['magenta', 'magenta', '#ef49d1']
            ] as const).map(([value, label, color]) => (
              <button key={value} className={`accent-choice ${settings.accent === value ? 'selected' : ''}`} aria-pressed={settings.accent === value} onClick={() => onChange({ accent: value })}>
                <span style={{ backgroundColor: color }} />{t(label)}{settings.accent === value && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>{t('cardSize')}</h3><p>{t('cardSizeDescription')}</p></div>
          <div className="choice-group" role="group" aria-label={t('cardSize')}>
            {([
              ['small', 'small'],
              ['medium', 'medium'],
              ['large', 'large']
            ] as const).map(([value, label]) => (
              <button key={value} className={`choice-button text-choice ${settings.cardSize === value ? 'selected' : ''}`} aria-pressed={settings.cardSize === value} onClick={() => onChange({ cardSize: value })}>
                {t(label)}{settings.cardSize === value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>{t('defaultView')}</h3><p>{t('defaultViewDescription')}</p></div>
          <div className="choice-group">
            <button className={`choice-button ${settings.defaultView === 'grid' ? 'selected' : ''}`} aria-pressed={settings.defaultView === 'grid'} onClick={() => onChange({ defaultView: 'grid' })}>
              <Grid2X2 size={16} /> {t('grid')} {settings.defaultView === 'grid' && <Check size={14} />}
            </button>
            <button className={`choice-button ${settings.defaultView === 'list' ? 'selected' : ''}`} aria-pressed={settings.defaultView === 'list'} onClick={() => onChange({ defaultView: 'list' })}>
              <List size={17} /> {t('list')} {settings.defaultView === 'list' && <Check size={14} />}
            </button>
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>{t('language')}</h3><p>{t('languageDescription')}</p></div>
          <div className="choice-group" role="group" aria-label={t('language')}>
            <button className={`choice-button text-choice ${settings.language === 'pt-BR' ? 'selected' : ''}`} aria-pressed={settings.language === 'pt-BR'} onClick={() => onChange({ language: 'pt-BR' })}>
              {t('portuguese')}{settings.language === 'pt-BR' && <Check size={14} />}
            </button>
            <button className={`choice-button text-choice ${settings.language === 'en' ? 'selected' : ''}`} aria-pressed={settings.language === 'en'} onClick={() => onChange({ language: 'en' })}>
              {t('english')}{settings.language === 'en' && <Check size={14} />}
            </button>
          </div>
        </div>
      </section>

    </section>
  )
}
