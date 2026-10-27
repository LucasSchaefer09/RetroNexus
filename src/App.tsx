import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Gamepad2, Library, Heart, Plus, Search, Settings, Grid2X2, List,
  ArrowDownWideNarrow, ChevronDown, Play, Pencil, Trash2, Star,
  Sparkles, X, Clock3
} from 'lucide-react'
import { GameForm } from './GameForm'
import { SettingsPage } from './SettingsPage'
import { translate } from './i18n'
import { CONSOLES, type AppSettings, type Game, type GameInput } from './types'

type Section = 'library' | 'favorites' | 'settings'
type SortMode = 'added' | 'name'

const defaultSettings: AppSettings = {
  theme: 'dark',
  accent: 'purple',
  cardSize: 'medium',
  defaultView: 'grid',
  language: 'pt-BR'
}

function coverSource(path: string): string {
  if (!path) return ''
  const normalized = path.replace(/\\/g, '/')
  const encoded = normalized.split('/').map((part, index) => index === 0 && part.endsWith(':') ? part : encodeURIComponent(part)).join('/')
  return `file:///${encoded.replace(/^\/+/, '')}`
}

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [section, setSection] = useState<Section>('library')
  const [consoleFilter, setConsoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const consoleFilterRef = useRef<HTMLDivElement>(null)
  const [sortMode, setSortMode] = useState<SortMode>('added')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [consoleFilterOpen, setConsoleFilterOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const settingsRef = useRef(defaultSettings)
  const settingsSaveQueue = useRef<Promise<void>>(Promise.resolve())
  const [formGame, setFormGame] = useState<Game | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.language, key)
  const locale = settings.language === 'en' ? 'en-US' : 'pt-BR'

  useEffect(() => {
    window.retroNexus.listGames()
      .then((items) => {
        setGames(items)
        if (items.length) setSelectedId(items[0].id)
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : t('libraryLoadError')))
      .finally(() => setLoading(false))
    window.retroNexus.getSettings()
      .then((savedSettings) => {
        settingsRef.current = savedSettings
        setSettings(savedSettings)
        setLayout(savedSettings.defaultView)
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : t('settingsLoadError')))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.accent = settings.accent
    root.dataset.cardSize = settings.cardSize
    root.lang = settings.language
  }, [settings])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    if (!consoleFilterOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!consoleFilterRef.current?.contains(event.target as Node)) setConsoleFilterOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConsoleFilterOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [consoleFilterOpen])

  const selectedGame = games.find((game) => game.id === selectedId) ?? null
  const visibleGames = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale)
    return games.filter((game) => {
      const matchesSection = section !== 'favorites' || game.favorite
      const matchesConsole = !consoleFilter || game.console === consoleFilter
      const matchesSearch = !query || `${game.name} ${game.console} ${game.genre}`.toLocaleLowerCase(locale).includes(query)
      return matchesSection && matchesConsole && matchesSearch
    }).sort((a, b) => sortMode === 'name'
      ? a.name.localeCompare(b.name, 'pt-BR')
      : b.dateAdded.localeCompare(a.dateAdded))
  }, [games, section, consoleFilter, search, sortMode, locale])

  async function saveGame(input: GameInput) {
    const updated = await window.retroNexus.saveGame(input)
    setGames(updated)
    const saved = input.id ? updated.find((game) => game.id === input.id) : updated[0]
    if (saved) setSelectedId(saved.id)
    setNotice(input.id ? t('gameUpdated') : t('gameAdded'))
  }

  async function updateSettings(changes: Partial<AppSettings>) {
    const next = { ...settingsRef.current, ...changes }
    settingsRef.current = next
    setSettings(next)
    setLayout(next.defaultView)
    const save = settingsSaveQueue.current.then(() => window.retroNexus.saveSettings(next))
    settingsSaveQueue.current = save.then(() => undefined, () => undefined)
    try {
      await save
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('settingsSaveError'))
    }
  }

  async function toggleFavorite(game: Game) {
    try {
      const updated = await window.retroNexus.saveGame({ ...game, favorite: !game.favorite })
      setGames(updated)
      setNotice(game.favorite ? t('favoriteRemoved') : t('favoriteAdded'))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('favoriteUpdateError'))
    }
  }

  async function removeGame(game: Game) {
    if (!window.confirm(t('removeConfirm').replace('{name}', game.name))) return
    try {
      const updated = await window.retroNexus.deleteGame(game.id)
      setGames(updated)
      setSelectedId((current) => current === game.id ? (updated[0]?.id ?? null) : current)
      setNotice(t('gameRemoved'))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('gameRemoveError'))
    }
  }

  async function launchGame(game: Game) {
    try {
      await window.retroNexus.launchGame(game.id)
      setGames(await window.retroNexus.listGames())
      setNotice(t('gameStarted').replace('{name}', game.name))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('gameLaunchError'))
    }
  }

  function openForm(game?: Game) {
    setFormGame(game)
    setShowForm(true)
  }

  function chooseSection(next: Section) {
    setSection(next)
    setConsoleFilter('')
  }

  const heading = section === 'favorites' ? t('favorites')
    : consoleFilter ? (consoleFilter === 'Outro' ? t('other') : consoleFilter)
      : section === 'settings' ? t('settings')
          : t('library')
  const platformLabel = (platform: string) => platform === 'Outro' ? t('other') : platform

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); chooseSection('library') }}>
          <img className="brand-mark" src="./retronexus-icon.png" alt="" />
          <span className="brand-name">Retro<span>Nexus</span><small>GAME LIBRARY</small></span>
        </a>
        <div className="sidebar-label">{t('mainMenu')}</div>
        <nav className="main-nav" aria-label={t('mainMenu')}>
          <button className={section === 'library' ? 'nav-item active' : 'nav-item'} onClick={() => chooseSection('library')}><Library size={18} /> {t('libraryNav')} <span className="nav-count">{games.length}</span></button>
          <button className={section === 'favorites' ? 'nav-item active' : 'nav-item'} onClick={() => chooseSection('favorites')}><Heart size={18} /> {t('favoritesNav')}</button>
          <button className="nav-item nav-add" onClick={() => openForm()}><Plus size={18} /> {t('addGame')}</button>
        </nav>
        <div className="sidebar-label console-label">{t('platforms')}</div>
        <div className="console-nav">
          {CONSOLES.filter((console) => games.some((game) => game.console === console)).map((console) => (
            <button key={console} className={consoleFilter === console ? 'console-item selected' : 'console-item'} onClick={() => { setSection('library'); setConsoleFilter(console) }}>
              <span className="console-dot" />{platformLabel(console)}<span className="console-count">{games.filter((game) => game.console === console).length}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="community-card"><span className="community-icon"><Sparkles size={16} /></span><strong>{t('communityTitle')}</strong><p>{settings.language === 'en' ? <>Every generation.<br />One community.</> : <>Todas as gerações.<br />Uma comunidade.</>}</p></div>
          <button className={section === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => chooseSection('settings')}><Settings size={18} /> {t('settingsNav')}</button>
          <div className="sidebar-version">RETRO NEXUS <span>v0.1.0</span></div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>{t('personalSpace')}</span><span className="crumb-slash">/</span><strong>{heading.toLocaleUpperCase(locale)}</strong></div>
        </header>

        <div className="content">
          {section === 'settings' ? (
            <SettingsPage settings={settings} onChange={(changes) => updateSettings(changes)} />
          ) : (
            <>
              {!loading && games.length === 0 && <section className="welcome-strip">
                <div className="welcome-copy"><div className="welcome-kicker"><span className="live-dot" /> {t('journey')}</div><h1>{settings.language === 'en' ? <>One library.<br /><span>Infinite memories.</span></> : <>Uma biblioteca.<br /><span>Infinitas memórias.</span></>}</h1><p>{t('welcomeDescription')}</p><button className="welcome-button" onClick={() => openForm()}><Plus size={16} /> {t('addFirstGame')}</button></div>
                <div className="welcome-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-glow" /><div className="art-console"><Gamepad2 size={89} strokeWidth={1.1} /></div><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✧</div><div className="art-chip">1990 — ∞</div></div>
              </section>}
              <section className="library-section">
                <div className="section-heading">
                  <div><p className="eyebrow">{section === 'favorites' ? t('specialSelection') : t('personalCollection')}</p><h2>{heading}<span className="title-count">{visibleGames.length}</span></h2></div>
                  <div className="section-actions">
                    <label className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchGame')} aria-label={t('searchGame')} />{search && <button aria-label={t('clearSearch')} onClick={() => setSearch('')}><X size={14} /></button>}</label>
                    <div className="filter-select" ref={consoleFilterRef}>
                      <button className={`filter-trigger ${consoleFilterOpen ? 'open' : ''}`} aria-label={t('filterConsole')} aria-haspopup="listbox" aria-expanded={consoleFilterOpen} onClick={() => setConsoleFilterOpen((open) => !open)}>
                        <span>{consoleFilter ? platformLabel(consoleFilter) : t('allConsoles')}</span><ChevronDown size={14} />
                      </button>
                      {consoleFilterOpen && <div className="console-options" role="listbox" aria-label={t('availableConsoles')}>
                        <button role="option" aria-selected={!consoleFilter} className={!consoleFilter ? 'console-option selected' : 'console-option'} onClick={() => { setConsoleFilter(''); setConsoleFilterOpen(false) }}>{t('allConsoles')}</button>
                        {CONSOLES.map((console) => <button key={console} role="option" aria-selected={consoleFilter === console} className={consoleFilter === console ? 'console-option selected' : 'console-option'} onClick={() => { setConsoleFilter(console); setConsoleFilterOpen(false) }}>{platformLabel(console)}</button>)}
                      </div>}
                    </div>
                    <button className="sort-button" onClick={() => setSortMode(sortMode === 'added' ? 'name' : 'added')} title={sortMode === 'added' ? t('sortByName') : t('sortByDate')}><ArrowDownWideNarrow size={16} /><span>{sortMode === 'added' ? t('added') : 'A–Z'}</span></button>
                    <div className="view-switch"><button onClick={() => setLayout('grid')} className={layout === 'grid' ? 'selected' : ''} aria-label={t('gridView')}><Grid2X2 size={16} /></button><button onClick={() => setLayout('list')} className={layout === 'list' ? 'selected' : ''} aria-label={t('listView')}><List size={17} /></button></div>
                  </div>
                </div>
                <div className="library-body">
                  <div className="game-area">
                    {loading ? <div className="loading-state">{t('preparingLibrary')}</div> : visibleGames.length ? (
                      <div className={layout === 'grid' ? 'game-grid' : 'game-list'}>
                        {visibleGames.map((game) => <button key={game.id} className={`game-card ${selectedId === game.id ? 'selected' : ''} ${layout === 'list' ? 'list-card' : ''}`} onClick={() => setSelectedId(game.id)}>
                          <div className="cover-wrap">
                            {game.coverPath ? <img src={coverSource(game.coverPath)} alt={settings.language === 'en' ? `Cover for ${game.name}` : `Capa de ${game.name}`} /> : <div className="cover-placeholder"><Gamepad2 size={32} /><span>{t('noCover')}</span></div>}
                            <span className="console-tag">{platformLabel(game.console)}</span>
                            <span className="play-overlay"><Play size={18} fill="currentColor" /></span>
                          </div>
                          <span className="game-card-info"><strong>{game.name}</strong><span>{game.genre || platformLabel(game.console)}</span></span>
                          <span className="game-card-trailing">{game.favorite && <Star size={15} fill="currentColor" />}{layout === 'list' && <span>{platformLabel(game.console)}</span>}</span>
                        </button>)}
                      </div>
                    ) : (
                      <div className="empty-library">
                        <div className="empty-icon">{games.length === 0 ? <Gamepad2 size={34} /> : <Search size={30} />}</div>
                        <h3>{games.length === 0 ? t('emptyTitle') : section === 'favorites' ? t('noFavorites') : t('noGamesFound')}</h3>
                        <p>{games.length === 0 ? t('emptyDescription') : section === 'favorites' ? t('favoritesDescription') : t('noResultsDescription')}</p>
                        {games.length === 0 && <button className="button button-primary" onClick={() => openForm()}><Plus size={16} /> {t('addGame')}</button>}
                        {games.length > 0 && (search || consoleFilter) && <button className="button button-quiet" onClick={() => { setSearch(''); setConsoleFilter('') }}>{t('clearFilters')}</button>}
                      </div>
                    )}
                  </div>

                  {selectedGame && <aside className="details-panel">
                    <div className="details-heading"><span>{t('gameDetails')}</span><button className="icon-button" onClick={() => setSelectedId(null)} aria-label={t('closeDetails')}><X size={16} /></button></div>
                    <div className="detail-cover">
                      {selectedGame.coverPath ? <img src={coverSource(selectedGame.coverPath)} alt={settings.language === 'en' ? `Cover for ${selectedGame.name}` : `Capa de ${selectedGame.name}`} /> : <div className="detail-cover-empty"><Gamepad2 size={48} /><span>RETRO<br />NEXUS</span></div>}
                      <button className={`favorite-toggle ${selectedGame.favorite ? 'is-favorite' : ''}`} onClick={() => void toggleFavorite(selectedGame)} aria-label={selectedGame.favorite ? t('removeFavorite') : t('addFavorite')}><Star size={17} fill={selectedGame.favorite ? 'currentColor' : 'none'} /></button>
                    </div>
                    <div className="detail-title"><div><span className="detail-console">{selectedGame.console}</span><h2>{selectedGame.name}</h2></div></div>
                    <div className="detail-meta">{selectedGame.genre && <span><span>{t('genre')}</span>{selectedGame.genre}</span>}<span><span>{t('status')}</span><i className="installed-dot" />{t('addedStatus')}</span></div>
                    <div className="detail-description"><h3>{t('aboutGame')}</h3><p>{selectedGame.description || t('noDescription')}</p></div>
                    <div className="detail-path" title={selectedGame.executablePath}><span>{t('executable')}</span><p>{selectedGame.executablePath}</p></div>
                    {selectedGame.lastPlayedAt && <div className="last-played"><Clock3 size={14} /> {t('lastPlayed')}: {new Date(`${selectedGame.lastPlayedAt.replace(' ', 'T')}Z`).toLocaleDateString(locale)}</div>}
                    <button className="launch-button" onClick={() => void launchGame(selectedGame)}><Play size={17} fill="currentColor" /> {t('playNow')}</button>
                    <div className="detail-actions"><button onClick={() => openForm(selectedGame)}><Pencil size={15} /> {t('edit')}</button><button onClick={() => void removeGame(selectedGame)}><Trash2 size={15} /> {t('remove')}</button></div>
                  </aside>}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label={t('dismiss')}><X size={15} /></button></div>}
      {showForm && <GameForm game={formGame} language={settings.language} onClose={() => setShowForm(false)} onSave={saveGame} />}
    </div>
  )
}

export default App
