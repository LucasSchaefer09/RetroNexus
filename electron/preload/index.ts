import { contextBridge, ipcRenderer } from 'electron'
import type { Game, GameInput } from '../main/database'
import type { AppSettings } from '../main/preferences'

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:save', settings),
  listGames: (): Promise<Game[]> => ipcRenderer.invoke('library:list'),
  saveGame: (game: GameInput): Promise<Game[]> => ipcRenderer.invoke('library:save', game),
  deleteGame: (id: number): Promise<Game[]> => ipcRenderer.invoke('library:delete', id),
  launchGame: (id: number): Promise<void> => ipcRenderer.invoke('library:launch', id),
  selectExecutable: (): Promise<string | null> => ipcRenderer.invoke('dialog:executable'),
  selectCover: (): Promise<{ path: string; dataUrl: string } | null> => ipcRenderer.invoke('dialog:cover'),
  saveCoverCrop: (dataUrl: string): Promise<string> => ipcRenderer.invoke('cover:save-crop', dataUrl),
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:directory')
}

contextBridge.exposeInMainWorld('retroNexus', api)
