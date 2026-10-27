import { useState, type FormEvent } from 'react'
import { FolderOpen, ImagePlus, X } from 'lucide-react'
import { ImageCropDialog } from './ImageCropDialog'
import { translate, type Language } from './i18n'
import { CONSOLES, type Game, type GameInput } from './types'

type Props = {
  game?: Game
  language: Language
  onClose: () => void
  onSave: (game: GameInput) => Promise<void>
}

const emptyGame = (): GameInput => ({
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

export function GameForm({ game, language, onClose, onSave }: Props) {
  const [form, setForm] = useState<GameInput>(game ? { ...game } : emptyGame())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [coverImage, setCoverImage] = useState<{ path: string; dataUrl: string } | null>(null)
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)

  function update<K extends keyof GameInput>(key: K, value: GameInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function chooseExecutable() {
    const path = await window.retroNexus.selectExecutable()
    if (path) update('executablePath', path)
  }

  async function chooseCover() {
    setError('')
    try {
      const image = await window.retroNexus.selectCover()
      if (image) setCoverImage(image)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('coverOpenError'))
    }
  }

  async function saveCoverCrop(dataUrl: string) {
    const path = await window.retroNexus.saveCoverCrop(dataUrl)
    update('coverPath', path)
    setCoverImage(null)
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
      setError(reason instanceof Error ? reason.message : t('formSaveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">{game ? t('personalCollection') : t('expandCollection')}</p>
            <h2 id="form-title">{game ? t('editGame') : t('addGame')}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={19} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>{t('gameName')} <i>*</i></span>
              <input autoFocus required maxLength={120} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Chrono Trigger" />
            </label>
            <label className="field">
              <span>{t('console')} <i>*</i></span>
              <select required value={form.console} onChange={(e) => update('console', e.target.value)}>
                {CONSOLES.map((console) => <option key={console} value={console}>{console === 'Outro' ? t('other') : console}</option>)}
              </select>
            </label>
            <label className="field field-wide">
              <span>{t('description')}</span>
              <textarea rows={3} maxLength={1000} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder={t('descriptionPlaceholder')} />
            </label>
            <label className="field">
              <span>{t('genre')} <small>{t('genreOptional')}</small></span>
              <input maxLength={80} value={form.genre} onChange={(e) => update('genre', e.target.value)} placeholder={t('genrePlaceholder')} />
            </label>
            <div className="field">
              <span>{t('cover')} <small>{t('genreOptional')}</small></span>
              <button type="button" className="file-picker" onClick={() => void chooseCover()}>
                <ImagePlus size={16} /> {form.coverPath ? t('changeImage') : t('selectImage')}
              </button>
              {form.coverPath && <small className="path-value" title={form.coverPath}>{form.coverPath}</small>}
              <small className="field-hint">{t('cropHint')}</small>
            </div>
            <div className="field field-wide">
              <span>{t('executable')} <i>*</i></span>
              <div className="input-action">
                <input required readOnly value={form.executablePath} placeholder={t('selectExecutable')} />
                <button type="button" className="file-picker" onClick={chooseExecutable}><FolderOpen size={16} /> {t('browse')}</button>
              </div>
            </div>
            <div className="field field-wide">
              <span>{t('workingDirectory')} <small>{t('genreOptional')}</small></span>
              <div className="input-action">
                <input readOnly value={form.workingDirectory} placeholder={t('workingDirectoryPlaceholder')} />
                <button type="button" className="file-picker" onClick={chooseDirectory}><FolderOpen size={16} /> {t('browse')}</button>
              </div>
            </div>
            <label className="field field-wide">
              <span>{t('launchArguments')} <small>{t('genreOptional')}</small></span>
              <input value={form.launchArguments} onChange={(e) => update('launchArguments', e.target.value)} placeholder={t('launchArgumentsPlaceholder')} />
              <small className="field-hint">{t('argumentsHint')}</small>
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="modal-footer">
            <button type="button" className="button button-quiet" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? t('saving') : game ? t('saveChanges') : t('addToLibrary')}</button>
          </footer>
        </form>
      </section>
      {coverImage && <ImageCropDialog image={coverImage} language={language} onCancel={() => setCoverImage(null)} onApply={saveCoverCrop} />}
    </div>
  )
}
