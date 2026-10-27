import { Check, Grid2X2, List, Moon, Sun } from 'lucide-react'
import type { AppSettings } from './types'

type Props = {
  settings: AppSettings
  onChange: (settings: Partial<AppSettings>) => void
}

export function SettingsPage({ settings, onChange }: Props) {
  return (
    <section className="settings-page">
      <p className="eyebrow">PERSONALIZE SUA EXPERIÊNCIA</p>
      <h1>Configurações</h1>

      <section className="preferences-section" aria-labelledby="appearance-heading">
        <div className="preferences-heading">
          <div>
            <h2 id="appearance-heading">Aparência</h2>
            <p>As preferências são salvas neste dispositivo e aplicadas imediatamente.</p>
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>Tema</h3><p>Escolha entre o modo escuro e o claro.</p></div>
          <div className="choice-group">
            <button className={`choice-button ${settings.theme === 'dark' ? 'selected' : ''}`} aria-pressed={settings.theme === 'dark'} onClick={() => onChange({ theme: 'dark' })}>
              <Moon size={16} /> Escuro {settings.theme === 'dark' && <Check size={14} />}
            </button>
            <button className={`choice-button ${settings.theme === 'light' ? 'selected' : ''}`} aria-pressed={settings.theme === 'light'} onClick={() => onChange({ theme: 'light' })}>
              <Sun size={16} /> Claro {settings.theme === 'light' && <Check size={14} />}
            </button>
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>Cor de destaque</h3><p>Defina a cor principal dos destaques da interface.</p></div>
          <div className="choice-group accent-choices" role="group" aria-label="Cor de destaque">
            {([
              ['purple', 'Roxo', '#713bff'],
              ['cyan', 'Ciano', '#31e6e0'],
              ['magenta', 'Magenta', '#ef49d1']
            ] as const).map(([value, label, color]) => (
              <button key={value} className={`accent-choice ${settings.accent === value ? 'selected' : ''}`} aria-pressed={settings.accent === value} onClick={() => onChange({ accent: value })}>
                <span style={{ backgroundColor: color }} />{label}{settings.accent === value && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>Tamanho dos cartões</h3><p>Ajuste quantos jogos aparecem por linha.</p></div>
          <div className="choice-group" role="group" aria-label="Tamanho dos cartões">
            {([
              ['small', 'Pequeno'],
              ['medium', 'Médio'],
              ['large', 'Grande']
            ] as const).map(([value, label]) => (
              <button key={value} className={`choice-button text-choice ${settings.cardSize === value ? 'selected' : ''}`} aria-pressed={settings.cardSize === value} onClick={() => onChange({ cardSize: value })}>
                {label}{settings.cardSize === value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className="preference-row">
          <div className="preference-copy"><h3>Visualização padrão</h3><p>Formato inicial ao abrir a biblioteca.</p></div>
          <div className="choice-group">
            <button className={`choice-button ${settings.defaultView === 'grid' ? 'selected' : ''}`} aria-pressed={settings.defaultView === 'grid'} onClick={() => onChange({ defaultView: 'grid' })}>
              <Grid2X2 size={16} /> Grade {settings.defaultView === 'grid' && <Check size={14} />}
            </button>
            <button className={`choice-button ${settings.defaultView === 'list' ? 'selected' : ''}`} aria-pressed={settings.defaultView === 'list'} onClick={() => onChange({ defaultView: 'list' })}>
              <List size={17} /> Lista {settings.defaultView === 'list' && <Check size={14} />}
            </button>
          </div>
        </div>
      </section>

    </section>
  )
}
