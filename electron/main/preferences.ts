import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export type AppSettings = {
  theme: 'dark' | 'light'
  accent: 'purple' | 'cyan' | 'magenta'
  cardSize: 'small' | 'medium' | 'large'
  defaultView: 'grid' | 'list'
}

export type ThirdPartyCredit = {
  name: string
  version: string
  license: string
}

export type ApplicationInfo = {
  name: string
  version: string
  platform: string
  electronVersion: string
  credits: ThirdPartyCredit[]
  repositoryUrl?: string
  issuesUrl?: string
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

function safeWebUrl(value: unknown): string | undefined {
  const rawCandidate = typeof value === 'string' ? value : typeof value === 'object' && value !== null && 'url' in value
    ? String((value as { url: unknown }).url)
    : undefined
  if (!rawCandidate) return undefined
  const candidate = rawCandidate.startsWith('git+https://') ? rawCandidate.slice(4) : rawCandidate
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function getApplicationInfo(): ApplicationInfo {
  const packagePath = join(app.getAppPath(), 'package.json')
  const lockPath = app.isPackaged
    ? join(process.resourcesPath, 'package-lock.json')
    : join(app.getAppPath(), 'package-lock.json')
  const appPackage = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    name?: string
    repository?: unknown
    bugs?: unknown
  }
  const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as {
    packages?: Record<string, { version?: string; license?: string | { type?: string } }>
  }
  const directPackages = Object.keys({
    ...((lock.packages?.[''] as { dependencies?: Record<string, string> } | undefined)?.dependencies ?? {}),
    ...((lock.packages?.[''] as { devDependencies?: Record<string, string> } | undefined)?.devDependencies ?? {})
  })
  const credits = directPackages.map((name) => {
    const item = lock.packages?.[`node_modules/${name}`]
    return {
      name,
      version: item?.version ?? 'versão não informada',
      license: typeof item?.license === 'string' ? item.license : item?.license?.type ?? 'licença não informada'
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
  const repository = safeWebUrl(appPackage.repository)
  const issues = safeWebUrl(appPackage.bugs)
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    electronVersion: process.versions.electron,
    credits,
    ...(repository ? { repositoryUrl: repository } : {}),
    ...(issues ? { issuesUrl: issues } : {})
  }
}

export function isConfiguredProjectUrl(value: string): boolean {
  const info = getApplicationInfo()
  return value === info.repositoryUrl || value === info.issuesUrl
}
