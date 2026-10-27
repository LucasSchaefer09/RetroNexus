import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export type AppSettings = {
  theme: 'dark' | 'light'
  accent: 'purple' | 'cyan' | 'magenta'
  cardSize: 'small' | 'medium' | 'large'
  defaultView: 'grid' | 'list'
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  accent: 'purple',
  cardSize: 'medium',
  defaultView: 'grid'
}

const settingsPath = () => join(app.getPath('userData'), 'settings.json')

function isAppSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false
  const settings = value as Record<string, unknown>
  return (settings.theme === 'dark' || settings.theme === 'light')
    && (settings.accent === 'purple' || settings.accent === 'cyan' || settings.accent === 'magenta')
    && (settings.cardSize === 'small' || settings.cardSize === 'medium' || settings.cardSize === 'large')
    && (settings.defaultView === 'grid' || settings.defaultView === 'list')
}

export function getSettings(): AppSettings {
  const path = settingsPath()
  mkdirSync(dirname(path), { recursive: true })
  if (!existsSync(path)) return { ...defaultSettings }
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (!isAppSettings(parsed)) throw new Error('O arquivo de configurações está inválido. Corrija ou remova settings.json para restaurar os padrões.')
  return parsed
}

export function saveSettings(value: unknown): AppSettings {
  if (!isAppSettings(value)) throw new Error('Preferências inválidas.')
  const path = settingsPath()
  mkdirSync(dirname(path), { recursive: true })
  const temporaryPath = `${path}.tmp`
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  renameSync(temporaryPath, path)
  return { ...value }
}
