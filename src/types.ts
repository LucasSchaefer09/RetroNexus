export const CONSOLES = [
  'PlayStation 1', 'PlayStation 2', 'PlayStation 3', 'PSP', 'PS Vita',
  'Master System', 'Mega Drive / Genesis', 'Sega Saturn', 'Dreamcast',
  'NES', 'SNES', 'Nintendo 64', 'Game Boy', 'Game Boy Color', 'Game Boy Advance',
  'Nintendo DS', 'Nintendo 3DS', 'GameCube', 'Wii', 'Wii U', 'Xbox', 'Xbox 360',
  'Outro'
] as const

export type Game = {
  id: number
  name: string
  console: string
  description: string
  genre: string
  coverPath: string
  executablePath: string
  workingDirectory: string
  launchArguments: string
  favorite: boolean
  dateAdded: string
  lastPlayedAt: string | null
}

export type GameInput = Omit<Game, 'id' | 'dateAdded' | 'lastPlayedAt'> & {
  id?: number
  dateAdded?: string
  lastPlayedAt?: string | null
}

export type AppSettings = {
  theme: 'dark' | 'light'
  accent: 'purple' | 'cyan' | 'magenta'
  cardSize: 'small' | 'medium' | 'large'
  defaultView: 'grid' | 'list'
}

declare global {
  interface Window {
    retroNexus: {
      getSettings: () => Promise<AppSettings>
      saveSettings: (settings: AppSettings) => Promise<AppSettings>
      listGames: () => Promise<Game[]>
      saveGame: (game: GameInput) => Promise<Game[]>
      deleteGame: (id: number) => Promise<Game[]>
      launchGame: (id: number) => Promise<void>
      selectExecutable: () => Promise<string | null>
      selectCover: () => Promise<string | null>
      selectDirectory: () => Promise<string | null>
    }
  }
}
