import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Gamepad2, Library, Heart, Plus, Search, Settings, Grid2X2, List,
  ArrowDownWideNarrow, ChevronDown, Play, Pencil, Trash2, Star,
  Sparkles, Joystick, X, Clock3
} from 'lucide-react'
import { GameForm } from './GameForm'
import { SettingsPage } from './SettingsPage'
import { CONSOLES, type AppSettings, type Game, type GameInput } from './types'

type Section = 'library' | 'favorites' | 'consoles' | 'settings'
type SortMode = 'added' | 'name'

const defaultSettings: AppSettings = {
  theme: 'dark',
  accent: 'purple',
  cardSize: 'medium',
  defaultView: 'grid'
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
  const [sortMode, setSortMode] = useState<SortMode>('added')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const settingsRef = useRef(defaultSettings)
  const settingsSaveQueue = useRef<Promise<void>>(Promise.resolve())
  const [formGame, setFormGame] = useState<Game | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.retroNexus.listGames()
      .then((items) => {
        setGames(items)
        if (items.length) setSelectedId(items[0].id)
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : 'Falha ao carregar a biblioteca.'))
      .finally(() => setLoading(false))
    window.retroNexus.getSettings()
      .then((savedSettings) => {
        settingsRef.current = savedSettings
        setSettings(savedSettings)
        setLayout(savedSettings.defaultView)
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : 'Falha ao carregar as preferências.'))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.accent = settings.accent
    root.dataset.cardSize = settings.cardSize
  }, [settings])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const selectedGame = games.find((game) => game.id === selectedId) ?? null
  const visibleGames = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return games.filter((game) => {
      const matchesSection = section !== 'favorites' || game.favorite
      const matchesConsole = !consoleFilter || game.console === consoleFilter
      const matchesSearch = !query || `${game.name} ${game.console} ${game.genre}`.toLocaleLowerCase('pt-BR').includes(query)
      return matchesSection && matchesConsole && matchesSearch
    }).sort((a, b) => sortMode === 'name'
      ? a.name.localeCompare(b.name, 'pt-BR')
      : b.dateAdded.localeCompare(a.dateAdded))
  }, [games, section, consoleFilter, search, sortMode])

  async function saveGame(input: GameInput) {
    const updated = await window.retroNexus.saveGame(input)
    setGames(updated)
    const saved = input.id ? updated.find((game) => game.id === input.id) : updated[0]
    if (saved) setSelectedId(saved.id)
    setNotice(input.id ? 'Jogo atualizado com sucesso.' : 'Jogo adicionado à biblioteca.')
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
      setNotice(error instanceof Error ? error.message : 'Não foi possível salvar as preferências.')
    }
  }

  async function toggleFavorite(game: Game) {
    try {
      const updated = await window.retroNexus.saveGame({ ...game, favorite: !game.favorite })
      setGames(updated)
      setNotice(game.favorite ? 'Jogo removido dos favoritos.' : 'Jogo adicionado aos favoritos.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível atualizar o favorito.')
    }
  }

  async function removeGame(game: Game) {
    if (!window.confirm(`Remover “${game.name}” da biblioteca?\n\nO arquivo do jogo não será excluído.`)) return
    try {
      const updated = await window.retroNexus.deleteGame(game.id)
      setGames(updated)
      setSelectedId((current) => current === game.id ? (updated[0]?.id ?? null) : current)
      setNotice('Jogo removido da biblioteca. O arquivo original foi mantido.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível remover o jogo.')
    }
  }

  async function launchGame(game: Game) {
    try {
      await window.retroNexus.launchGame(game.id)
      setGames(await window.retroNexus.listGames())
      setNotice(`${game.name} iniciado.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível iniciar o jogo.')
    }
  }

  function openForm(game?: Game) {
    setFormGame(game)
    setShowForm(true)
  }

  function chooseSection(next: Section) {
    setSection(next)
    setConsoleFilter('')
    if (next === 'consoles') setConsoleFilter('')
  }

  const heading = section === 'favorites' ? 'Seus favoritos'
    : consoleFilter ? consoleFilter
      : section === 'consoles' ? 'Consoles'
        : section === 'settings' ? 'Configurações'
          : 'Sua biblioteca'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); chooseSection('library') }}>
          <span className="brand-mark"><Gamepad2 size={25} strokeWidth={2.2} /></span>
          <span className="brand-name">Retro<span>Nexus</span><small>GAME LIBRARY</small></span>
        </a>
        <div className="sidebar-label">MENU PRINCIPAL</div>
        <nav className="main-nav" aria-label="Navegação principal">
          <button className={section === 'library' ? 'nav-item active' : 'nav-item'} onClick={() => chooseSection('library')}><Library size={18} /> Biblioteca <span className="nav-count">{games.length}</span></button>
          <button className={section === 'favorites' ? 'nav-item active' : 'nav-item'} onClick={() => chooseSection('favorites')}><Heart size={18} /> Favoritos</button>
          <button className="nav-item nav-add" onClick={() => openForm()}><Plus size={18} /> Adicionar jogo</button>
          <button className={section === 'consoles' ? 'nav-item active' : 'nav-item'} onClick={() => chooseSection('consoles')}><Joystick size={18} /> Consoles</button>
        </nav>
        <div className="sidebar-label console-label">PLATAFORMAS</div>
        <div className="console-nav">
          {CONSOLES.filter((console) => games.some((game) => game.console === console)).slice(0, 7).map((console) => (
            <button key={console} className={consoleFilter === console ? 'console-item selected' : 'console-item'} onClick={() => { setSection('library'); setConsoleFilter(console) }}>
              <span className="console-dot" />{console}<span className="console-count">{games.filter((game) => game.console === console).length}</span>
            </button>
          ))}
          {games.length > 0 && <button className="see-all" onClick={() => chooseSection('consoles')}>Ver todos os consoles <ChevronDown size={14} /></button>}
        </div>
        <div className="sidebar-bottom">
          <div className="community-card"><span className="community-icon"><Sparkles size={16} /></span><strong>Feito para quem joga</strong><p>Todas as gerações.<br />Uma comunidade.</p></div>
          <button className={section === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => chooseSection('settings')}><Settings size={18} /> Configurações</button>
          <div className="sidebar-version">RETRO NEXUS <span>v0.1.0</span></div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>ESPAÇO PESSOAL</span><span className="crumb-slash">/</span><strong>{heading.toLocaleUpperCase('pt-BR')}</strong></div>
          <div className="topbar-right">
            <div className="status-pill"><span /> Biblioteca local</div>
            <button className="top-add" onClick={() => openForm()}><Plus size={16} /> Adicionar jogo</button>
            <div className="avatar">RN</div>
          </div>
        </header>

        <div className="content">
          {section === 'settings' ? (
            <SettingsPage settings={settings} onChange={(changes) => updateSettings(changes)} />
          ) : section === 'consoles' && !consoleFilter ? (
            <section className="consoles-page">
              <div className="page-title-row"><div><p className="eyebrow">ORGANIZE POR GERAÇÃO</p><h1>Consoles</h1><p className="page-subtitle">Escolha uma plataforma para explorar seus jogos.</p></div></div>
              <div className="platform-grid">
                {CONSOLES.map((console, index) => {
                  const count = games.filter((game) => game.console === console).length
                  return <button key={console} className={`platform-card platform-color-${index % 4}`} onClick={() => { setConsoleFilter(console); setSection('library') }}>
                    <span className="platform-symbol"><Joystick size={22} /></span><strong>{console}</strong><span>{count} {count === 1 ? 'jogo' : 'jogos'}</span><ChevronDown size={16} className="platform-arrow" />
                  </button>
                })}
              </div>
            </section>
          ) : (
            <>
              <section className="welcome-strip">
                <div className="welcome-copy"><div className="welcome-kicker"><span className="live-dot" /> SUA JORNADA CONTINUA</div><h1>Uma biblioteca.<br /><span>Infinitas memórias.</span></h1><p>Reúna seus clássicos favoritos em um só lugar.</p><button className="welcome-button" onClick={() => openForm()}><Plus size={16} /> Adicionar primeiro jogo</button></div>
                <div className="welcome-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-glow" /><div className="art-console"><Gamepad2 size={89} strokeWidth={1.1} /></div><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✧</div><div className="art-chip">1990 — ∞</div></div>
              </section>
              <section className="library-section">
                <div className="section-heading">
                  <div><p className="eyebrow">{section === 'favorites' ? 'SELEÇÃO ESPECIAL' : 'SUA COLEÇÃO PESSOAL'}</p><h2>{heading}<span className="title-count">{visibleGames.length}</span></h2></div>
                  <div className="section-actions">
                    <label className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar jogo..." aria-label="Buscar jogo" />{search && <button aria-label="Limpar busca" onClick={() => setSearch('')}><X size={14} /></button>}</label>
                    <label className="filter-select"><select aria-label="Filtrar por console" value={consoleFilter} onChange={(e) => setConsoleFilter(e.target.value)}><option value="">Todos os consoles</option>{CONSOLES.map((console) => <option key={console}>{console}</option>)}</select><ChevronDown size={14} /></label>
                    <button className="sort-button" onClick={() => setSortMode(sortMode === 'added' ? 'name' : 'added')} title={sortMode === 'added' ? 'Ordenar por nome' : 'Ordenar por data de adição'}><ArrowDownWideNarrow size={16} /><span>{sortMode === 'added' ? 'Adicionados' : 'A–Z'}</span></button>
                    <div className="view-switch"><button onClick={() => setLayout('grid')} className={layout === 'grid' ? 'selected' : ''} aria-label="Visualização em grade"><Grid2X2 size={16} /></button><button onClick={() => setLayout('list')} className={layout === 'list' ? 'selected' : ''} aria-label="Visualização em lista"><List size={17} /></button></div>
                  </div>
                </div>
                <div className="library-body">
                  <div className="game-area">
                    {loading ? <div className="loading-state">Preparando sua biblioteca...</div> : visibleGames.length ? (
                      <div className={layout === 'grid' ? 'game-grid' : 'game-list'}>
                        {visibleGames.map((game) => <button key={game.id} className={`game-card ${selectedId === game.id ? 'selected' : ''} ${layout === 'list' ? 'list-card' : ''}`} onClick={() => setSelectedId(game.id)}>
                          <div className="cover-wrap">
                            {game.coverPath ? <img src={coverSource(game.coverPath)} alt={`Capa de ${game.name}`} /> : <div className="cover-placeholder"><Gamepad2 size={32} /><span>SEM CAPA</span></div>}
                            <span className="console-tag">{game.console}</span>
                            <span className="play-overlay"><Play size={18} fill="currentColor" /></span>
                          </div>
                          <span className="game-card-info"><strong>{game.name}</strong><span>{game.genre || game.console}</span></span>
                          <span className="game-card-trailing">{game.favorite && <Star size={15} fill="currentColor" />}{layout === 'list' && <span>{game.console}</span>}</span>
                        </button>)}
                      </div>
                    ) : (
                      <div className="empty-library">
                        <div className="empty-icon">{games.length === 0 ? <Gamepad2 size={34} /> : <Search size={30} />}</div>
                        <h3>{games.length === 0 ? 'Sua próxima aventura começa aqui' : section === 'favorites' ? 'Ainda sem favoritos' : 'Nenhum jogo encontrado'}</h3>
                        <p>{games.length === 0 ? 'Adicione um jogo que você já possui para montar sua coleção.' : section === 'favorites' ? 'Marque um jogo com a estrela para encontrá-lo aqui.' : 'Tente ajustar a busca ou os filtros selecionados.'}</p>
                        {games.length === 0 && <button className="button button-primary" onClick={() => openForm()}><Plus size={16} /> Adicionar jogo</button>}
                        {games.length > 0 && (search || consoleFilter) && <button className="button button-quiet" onClick={() => { setSearch(''); setConsoleFilter('') }}>Limpar filtros</button>}
                      </div>
                    )}
                  </div>

                  {selectedGame && <aside className="details-panel">
                    <div className="details-heading"><span>DETALHES DO JOGO</span><button className="icon-button" onClick={() => setSelectedId(null)} aria-label="Fechar detalhes"><X size={16} /></button></div>
                    <div className="detail-cover">
                      {selectedGame.coverPath ? <img src={coverSource(selectedGame.coverPath)} alt={`Capa de ${selectedGame.name}`} /> : <div className="detail-cover-empty"><Gamepad2 size={48} /><span>RETRO<br />NEXUS</span></div>}
                      <button className={`favorite-toggle ${selectedGame.favorite ? 'is-favorite' : ''}`} onClick={() => void toggleFavorite(selectedGame)} aria-label={selectedGame.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}><Star size={17} fill={selectedGame.favorite ? 'currentColor' : 'none'} /></button>
                    </div>
                    <div className="detail-title"><div><span className="detail-console">{selectedGame.console}</span><h2>{selectedGame.name}</h2></div></div>
                    <div className="detail-meta">{selectedGame.genre && <span><span>GÊNERO</span>{selectedGame.genre}</span>}<span><span>STATUS</span><i className="installed-dot" />Adicionado</span></div>
                    <div className="detail-description"><h3>Sobre o jogo</h3><p>{selectedGame.description || 'Nenhuma descrição foi adicionada ainda.'}</p></div>
                    <div className="detail-path" title={selectedGame.executablePath}><span>EXECUTÁVEL</span><p>{selectedGame.executablePath}</p></div>
                    {selectedGame.lastPlayedAt && <div className="last-played"><Clock3 size={14} /> Última execução: {new Date(`${selectedGame.lastPlayedAt.replace(' ', 'T')}Z`).toLocaleDateString('pt-BR')}</div>}
                    <button className="launch-button" onClick={() => void launchGame(selectedGame)}><Play size={17} fill="currentColor" /> Jogar agora</button>
                    <div className="detail-actions"><button onClick={() => openForm(selectedGame)}><Pencil size={15} /> Editar</button><button onClick={() => void removeGame(selectedGame)}><Trash2 size={15} /> Remover</button></div>
                  </aside>}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dispensar"><X size={15} /></button></div>}
      {showForm && <GameForm game={formGame} onClose={() => setShowForm(false)} onSave={saveGame} />}
    </div>
  )
}

export default App
