import { useState, type FormEvent } from 'react'
import { FolderOpen, ImagePlus, X } from 'lucide-react'
import { CONSOLES, type Game, type GameInput } from './types'

type Props = {
  game?: Game
  onClose: () => void
  onSave: (game: GameInput) => Promise<void>
}

const emptyGame = (): GameInput => ({
  id: 0,
  name: '',
  console: CONSOLES[0],
  description: '',
  genre: '',
  coverPath: '',
  executablePath: '',
  workingDirectory: '',
  launchArguments: '',
  favorite: false
})

export function GameForm({ game, onClose, onSave }: Props) {
  const [form, setForm] = useState<GameInput>(game ? { ...game } : emptyGame())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update<K extends keyof GameInput>(key: K, value: GameInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function chooseExecutable() {
    const path = await window.retroNexus.selectExecutable()
    if (path) update('executablePath', path)
  }

  async function chooseCover() {
    const path = await window.retroNexus.selectCover()
    if (path) update('coverPath', path)
  }

  async function chooseDirectory() {
    const path = await window.retroNexus.selectDirectory()
    if (path) update('workingDirectory', path)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o jogo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">{game ? 'SUA COLEÇÃO' : 'EXPANDA SUA COLEÇÃO'}</p>
            <h2 id="form-title">{game ? 'Editar jogo' : 'Adicionar jogo'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>Nome do jogo <i>*</i></span>
              <input autoFocus required maxLength={120} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex.: Chrono Trigger" />
            </label>
            <label className="field">
              <span>Console <i>*</i></span>
              <select required value={form.console} onChange={(e) => update('console', e.target.value)}>
                {CONSOLES.map((console) => <option key={console}>{console}</option>)}
              </select>
            </label>
            <label className="field field-wide">
              <span>Descrição</span>
              <textarea rows={3} maxLength={1000} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Uma breve descrição para lembrar sua aventura..." />
            </label>
            <label className="field">
              <span>Gênero <small>OPCIONAL</small></span>
              <input maxLength={80} value={form.genre} onChange={(e) => update('genre', e.target.value)} placeholder="RPG, plataforma..." />
            </label>
            <div className="field">
              <span>Capa <small>OPCIONAL</small></span>
              <button type="button" className="file-picker" onClick={chooseCover}>
                <ImagePlus size={16} /> {form.coverPath ? 'Trocar imagem' : 'Selecionar imagem'}
              </button>
              {form.coverPath && <small className="path-value" title={form.coverPath}>{form.coverPath}</small>}
            </div>
            <div className="field field-wide">
              <span>Executável <i>*</i></span>
              <div className="input-action">
                <input required readOnly value={form.executablePath} placeholder="Selecione o executável do jogo" />
                <button type="button" className="file-picker" onClick={chooseExecutable}><FolderOpen size={16} /> Procurar</button>
              </div>
            </div>
            <div className="field field-wide">
              <span>Diretório de trabalho <small>OPCIONAL</small></span>
              <div className="input-action">
                <input readOnly value={form.workingDirectory} placeholder="Usar a pasta do executável" />
                <button type="button" className="file-picker" onClick={chooseDirectory}><FolderOpen size={16} /> Procurar</button>
              </div>
            </div>
            <label className="field field-wide">
              <span>Argumentos de inicialização <small>OPCIONAL</small></span>
              <input value={form.launchArguments} onChange={(e) => update('launchArguments', e.target.value)} placeholder={'Ex.: --fullscreen --profile "Meu perfil"'} />
              <small className="field-hint">Argumentos são separados por espaços. Use aspas para valores com espaços; nenhum shell será utilizado.</small>
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="modal-footer">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Salvando...' : game ? 'Salvar alterações' : 'Adicionar à biblioteca'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
