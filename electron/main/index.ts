import { app, BrowserWindow, dialog, ipcMain, Menu, shell, type IpcMainInvokeEvent } from 'electron'
import { spawn } from 'node:child_process'
import { access, constants, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { isAbsolute, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deleteGame, initializeDatabase, listGames, markGamePlayed, saveGame, type GameInput } from './database'
import { getSettings, saveSettings } from './preferences'

const preloadPath = fileURLToPath(new URL('../preload/index.js', import.meta.url))
const rendererUrl = process.env.ELECTRON_RENDERER_URL
const rendererFilePath = fileURLToPath(new URL('../../out/renderer/index.html', import.meta.url))

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  const senderUrl = event.senderFrame?.url
  try {
    if (rendererUrl) {
      if (new URL(senderUrl ?? '').origin === new URL(rendererUrl).origin) return
    } else if (senderUrl && fileURLToPath(senderUrl) === rendererFilePath) {
      return
    }
  } catch {
    // Invalid sender URLs are rejected below.
  }
  throw new Error('Origem não autorizada para esta operação.')
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1050,
    minHeight: 680,
    backgroundColor: '#0b1020',
    title: 'RetroNexus',
    autoHideMenuBar: true,
    icon: app.isPackaged
      ? resolve(process.resourcesPath, process.platform === 'win32' ? 'icon.ico' : 'icon.png')
      : resolve(app.getAppPath(), 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  window.setMenuBarVisibility(false)
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, url) => {
    try {
      const allowed = rendererUrl
        ? new URL(url).origin === new URL(rendererUrl).origin
        : fileURLToPath(url) === rendererFilePath
      if (!allowed) event.preventDefault()
    } catch {
      event.preventDefault()
    }
  })
  if (rendererUrl) void window.loadURL(rendererUrl)
  else void window.loadFile(rendererFilePath)
  return window
}

function validateGameInput(value: unknown): GameInput {
  if (!value || typeof value !== 'object') throw new Error('Dados do jogo inválidos.')
  const input = value as Record<string, unknown>
  const text = (key: string, required = false): string => {
    const field = input[key]
    if (typeof field !== 'string' || (required && !field.trim())) {
      throw new Error(required ? `Preencha o campo ${key === 'name' ? 'nome' : 'console'}.` : `Campo ${key} inválido.`)
    }
    return field.trim()
  }
  if (input.id !== undefined && (!Number.isSafeInteger(input.id) || Number(input.id) < 1)) {
    throw new Error('Identificador do jogo inválido.')
  }
  if (input.favorite !== undefined && typeof input.favorite !== 'boolean') throw new Error('Favorito inválido.')
  const executablePath = text('executablePath', true)
  if (!isAbsolute(executablePath)) throw new Error('Selecione um caminho absoluto para o executável.')
  const workingDirectory = text('workingDirectory')
  if (workingDirectory && !isAbsolute(workingDirectory)) throw new Error('O diretório de trabalho deve ser absoluto.')
  const coverPath = text('coverPath')
  if (coverPath && !isAbsolute(coverPath)) throw new Error('O caminho da capa deve ser absoluto.')
  return {
    id: input.id as number | undefined,
    name: text('name', true),
    console: text('console', true),
    description: text('description'),
    genre: text('genre'),
    coverPath,
    executablePath,
    workingDirectory,
    launchArguments: text('launchArguments'),
    favorite: input.favorite === true
  }
}

function splitArguments(value: string): string[] {
  const args: string[] = []
  let token = ''
  let quote: '"' | "'" | null = null
  let tokenStarted = false
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (char === '\\' && quote !== "'") {
      const next = value[index + 1]
      if (next && (next === '"' || next === "'" || next === '\\' || /\s/.test(next))) {
        token += next
        tokenStarted = true
        index += 1
      } else {
        token += char
        tokenStarted = true
      }
    } else if (quote) {
      if (char === quote) quote = null
      else {
        token += char
        tokenStarted = true
      }
    } else if (char === '"' || char === "'") {
      quote = char
      tokenStarted = true
    } else if (/\s/.test(char)) {
      if (tokenStarted) args.push(token)
      token = ''
      tokenStarted = false
    } else {
      token += char
      tokenStarted = true
    }
  }
  if (quote) throw new Error('Argumentos inválidos: verifique as aspas.')
  if (tokenStarted) args.push(token)
  return args
}

async function launchGame(id: unknown): Promise<void> {
  if (!Number.isSafeInteger(id) || Number(id) < 1) throw new Error('Identificador do jogo inválido.')
  const game = listGames().find((item) => item.id === id)
  if (!game) throw new Error('Este jogo não existe mais na biblioteca.')
  try {
    const fileStat = await stat(game.executablePath)
    if (!fileStat.isFile()) throw new Error('O caminho configurado não aponta para um arquivo.')
  } catch (error) {
    if (error instanceof Error && error.message === 'O caminho configurado não aponta para um arquivo.') throw error
    throw new Error('O executável não foi encontrado. Edite o jogo para corrigir o caminho.')
  }
  const isShortcut = process.platform === 'win32' && extname(game.executablePath).toLowerCase() === '.lnk'
  if (isShortcut) {
    if (game.launchArguments.trim()) throw new Error('Argumentos personalizados não são compatíveis com atalhos .lnk.')
    const result = await shell.openPath(game.executablePath)
    if (result) throw new Error(`Não foi possível abrir o atalho: ${result}`)
  } else {
    if (process.platform !== 'win32') {
      try {
        await access(game.executablePath, constants.X_OK)
      } catch {
        throw new Error('Este arquivo não tem permissão de execução. Ajuste a permissão no Linux e tente novamente.')
      }
    }
    const cwd = game.workingDirectory || resolve(game.executablePath, '..')
    try {
      const cwdStat = await stat(cwd)
      if (!cwdStat.isDirectory()) throw new Error()
    } catch {
      throw new Error('O diretório de trabalho não está acessível. Edite o jogo para corrigir o caminho.')
    }
    const args = splitArguments(game.launchArguments)
    await new Promise<void>((resolveLaunch, rejectLaunch) => {
      const child = spawn(game.executablePath, args, { cwd, shell: false, windowsHide: true, detached: true, stdio: 'ignore' })
      child.once('error', (error) => rejectLaunch(new Error(`Não foi possível iniciar o jogo: ${error.message}`)))
      child.once('spawn', () => {
        child.unref()
        resolveLaunch()
      })
    })
  }
  markGamePlayed(game.id)
}

function registerIpc(): void {
  ipcMain.handle('settings:get', (event) => {
    assertTrustedSender(event)
    return getSettings()
  })
  ipcMain.handle('settings:save', (event, settings: unknown) => {
    assertTrustedSender(event)
    return saveSettings(settings)
  })
  ipcMain.handle('library:list', (event) => {
    assertTrustedSender(event)
    return listGames()
  })
  ipcMain.handle('library:save', (event, input: unknown) => {
    assertTrustedSender(event)
    return saveGame(validateGameInput(input))
  })
  ipcMain.handle('library:delete', (event, id: unknown) => {
    assertTrustedSender(event)
    if (!Number.isSafeInteger(id) || Number(id) < 1) throw new Error('Identificador do jogo inválido.')
    return deleteGame(Number(id))
  })
  ipcMain.handle('library:launch', (event, id: unknown) => {
    assertTrustedSender(event)
    return launchGame(id)
  })
  ipcMain.handle('dialog:executable', async (event) => {
    assertTrustedSender(event)
    const filters = process.platform === 'win32'
      ? [{ name: 'Programas e atalhos', extensions: ['exe', 'lnk'] }, { name: 'Todos os arquivos', extensions: ['*'] }]
      : [{ name: 'Executáveis', extensions: ['*'] }]
    const result = await dialog.showOpenDialog({ properties: ['openFile'], filters })
    return result.canceled ? null : result.filePaths[0]
  })
  ipcMain.handle('dialog:cover', async (event) => {
    assertTrustedSender(event)
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
    })
    if (result.canceled) return null
    const path = result.filePaths[0]
    const file = await stat(path)
    if (file.size > 40 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 40 MB.')
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    }
    const mimeType = mimeTypes[extname(path).toLowerCase()]
    if (!mimeType) throw new Error('Formato de imagem não suportado.')
    const image = await readFile(path)
    return { path, dataUrl: `data:${mimeType};base64,${image.toString('base64')}` }
  })
  ipcMain.handle('cover:save-crop', async (event, value: unknown) => {
    assertTrustedSender(event)
    if (typeof value !== 'string' || value.length > 16 * 1024 * 1024) {
      throw new Error('A imagem recortada é inválida ou muito grande.')
    }
    const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
    if (!match) throw new Error('A imagem recortada deve estar no formato PNG.')
    const image = Buffer.from(match[1], 'base64')
    if (image.length < 20 || image.length > 12 * 1024 * 1024 ||
      image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      image.subarray(-8, -4).toString('ascii') !== 'IEND') {
      throw new Error('Os dados da imagem recortada são inválidos.')
    }
    const coversDirectory = resolve(app.getPath('userData'), 'covers')
    await mkdir(coversDirectory, { recursive: true })
    const path = resolve(coversDirectory, `${randomUUID()}.png`)
    const temporaryPath = `${path}.tmp`
    try {
      await writeFile(temporaryPath, image, { flag: 'wx' })
      await rename(temporaryPath, path)
    } catch (error) {
      throw new Error(`Não foi possível salvar a capa: ${error instanceof Error ? error.message : String(error)}`)
    }
    return path
  })
  ipcMain.handle('dialog:directory', async (event) => {
    assertTrustedSender(event)
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  await initializeDatabase()
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  dialog.showErrorBox('Falha ao iniciar o RetroNexus', message)
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
