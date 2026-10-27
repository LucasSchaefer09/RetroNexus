import initSqlJs, { type Database as SqlDatabase } from 'sql.js'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { app } from 'electron'

export type GameInput = {
  id?: number
  name: string
  console: string
  description: string
  genre: string
  coverPath: string
  executablePath: string
  workingDirectory: string
  launchArguments: string
  favorite: boolean
}

export type Game = Omit<GameInput, 'id'> & {
  id: number
  dateAdded: string
  lastPlayedAt: string | null
}

let database: SqlDatabase | undefined
let databasePath: string

export async function initializeDatabase(): Promise<void> {
  databasePath = join(app.getPath('userData'), 'library.sqlite')
  mkdirSync(dirname(databasePath), { recursive: true })
  const require = createRequire(import.meta.url)
  const sqlJsPath = require.resolve('sql.js')
  const wasmPath = join(dirname(sqlJsPath), 'sql-wasm.wasm')
  const SQL = await initSqlJs({ locateFile: () => wasmPath })
  database = existsSync(databasePath)
    ? new SQL.Database(new Uint8Array(readFileSync(databasePath)))
    : new SQL.Database()
  database.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      console TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      genre TEXT NOT NULL DEFAULT '',
      cover_path TEXT NOT NULL DEFAULT '',
      executable_path TEXT NOT NULL,
      working_directory TEXT NOT NULL DEFAULT '',
      launch_arguments TEXT NOT NULL DEFAULT '',
      favorite INTEGER NOT NULL DEFAULT 0,
      date_added TEXT NOT NULL DEFAULT (datetime('now')),
      last_played_at TEXT
    );
    CREATE INDEX IF NOT EXISTS games_name_idx ON games(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS games_console_idx ON games(console);
  `)
  persist()
}

function getDatabase(): SqlDatabase {
  if (!database) throw new Error('O banco de dados ainda não foi inicializado.')
  return database
}

function persist(): void {
  const temporaryPath = `${databasePath}.tmp`
  writeFileSync(temporaryPath, getDatabase().export())
  renameSync(temporaryPath, databasePath)
}

function queryGames(sql: string, values: Array<number | string | Uint8Array | null> = []): Record<string, unknown>[] {
  const statement = getDatabase().prepare(sql)
  try {
    statement.bind(values)
    const rows: Record<string, unknown>[] = []
    while (statement.step()) rows.push(statement.getAsObject() as Record<string, unknown>)
    return rows
  } finally {
    statement.free()
  }
}

function toGame(row: Record<string, unknown>): Game {
  return {
    id: Number(row.id),
    name: String(row.name),
    console: String(row.console),
    description: String(row.description ?? ''),
    genre: String(row.genre ?? ''),
    coverPath: String(row.cover_path ?? ''),
    executablePath: String(row.executable_path),
    workingDirectory: String(row.working_directory ?? ''),
    launchArguments: String(row.launch_arguments ?? ''),
    favorite: Boolean(row.favorite),
    dateAdded: String(row.date_added),
    lastPlayedAt: row.last_played_at ? String(row.last_played_at) : null
  }
}

export function listGames(): Game[] {
  return queryGames('SELECT * FROM games ORDER BY date_added DESC, id DESC').map(toGame)
}

export function saveGame(input: GameInput): Game[] {
  const db = getDatabase()
  if (input.id) {
    db.run(`
      UPDATE games SET name = ?, console = ?, description = ?, genre = ?, cover_path = ?,
        executable_path = ?, working_directory = ?, launch_arguments = ?, favorite = ?
      WHERE id = ?
    `, [input.name, input.console, input.description, input.genre, input.coverPath,
      input.executablePath, input.workingDirectory, input.launchArguments, Number(input.favorite), input.id])
    if (db.getRowsModified() === 0) throw new Error('Este jogo não existe mais na biblioteca.')
  } else {
    db.run(`
      INSERT INTO games (name, console, description, genre, cover_path, executable_path,
        working_directory, launch_arguments, favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [input.name, input.console, input.description, input.genre, input.coverPath,
      input.executablePath, input.workingDirectory, input.launchArguments, Number(input.favorite)])
  }
  persist()
  return listGames()
}

export function deleteGame(id: number): Game[] {
  getDatabase().run('DELETE FROM games WHERE id = ?', [id])
  if (getDatabase().getRowsModified() === 0) throw new Error('Este jogo não existe mais na biblioteca.')
  persist()
  return listGames()
}

export function markGamePlayed(id: number): void {
  getDatabase().run("UPDATE games SET last_played_at = datetime('now') WHERE id = ?", [id])
  if (getDatabase().getRowsModified() === 0) throw new Error('Este jogo não existe mais na biblioteca.')
  persist()
}
