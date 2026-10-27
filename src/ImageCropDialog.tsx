import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ImagePlus, RotateCcw, X } from 'lucide-react'
import { translate, type Language } from './i18n'

type Props = {
  image: { path: string; dataUrl: string }
  language: Language
  onCancel: () => void
  onApply: (dataUrl: string) => Promise<void>
}

type Offset = { x: number; y: number }

const OUTPUT_WIDTH = 768
const ASPECT_RATIO = 1.16

export function ImageCropDialog({ image, language, onCancel, onApply }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const dragStart = useRef<{ pointerX: number; pointerY: number; offset: Offset } | null>(null)
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onCancel()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onCancel, saving])

  const baseScale = imageSize.width && frameSize.width
    ? Math.max(frameSize.width / imageSize.width, frameSize.height / imageSize.height)
    : 0
  const displayWidth = imageSize.width * baseScale * zoom
  const displayHeight = imageSize.height * baseScale * zoom
  const maxOffsetX = Math.max(0, (displayWidth - frameSize.width) / 2)
  const maxOffsetY = Math.max(0, (displayHeight - frameSize.height) / 2)
  const boundedOffset = {
    x: Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x)),
    y: Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y))
  }
  const imageLeft = (frameSize.width - displayWidth) / 2 + boundedOffset.x
  const imageTop = (frameSize.height - displayHeight) / 2 + boundedOffset.y

  function moveImage(event: PointerEvent<HTMLDivElement>) {
    const start = dragStart.current
    if (!start) return
    setOffset({
      x: start.offset.x + event.clientX - start.pointerX,
      y: start.offset.y + event.clientY - start.pointerY
    })
  }

  async function applyCrop() {
    const source = imageRef.current
    if (!source || !baseScale) return
    setError('')
    setSaving(true)
    try {
      const outputHeight = Math.round(OUTPUT_WIDTH / ASPECT_RATIO)
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_WIDTH
      canvas.height = outputHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error(t('cropPrepareError'))
      const sourceScale = baseScale * zoom
      context.drawImage(
        source,
        Math.max(0, -imageLeft / sourceScale),
        Math.max(0, -imageTop / sourceScale),
        frameSize.width / sourceScale,
        frameSize.height / sourceScale,
        0,
        0,
        OUTPUT_WIDTH,
        outputHeight
      )
      await onApply(canvas.toDataURL('image/png'))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('cropError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop crop-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && onCancel()}>
      <section className="crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">{t('cropEyebrow')}</p>
            <h2 id="crop-title">{t('cropTitle')}</h2>
          </div>
          <button className="icon-button" onClick={onCancel} disabled={saving} aria-label={t('close')}><X size={19} /></button>
        </header>
        <p className="crop-help">{t('cropHelp')}</p>
        <p className="crop-filename" title={image.path}>{image.path.split(/[\\/]/).pop()}</p>
        <div
          ref={frameRef}
          className={`crop-frame${imageSize.width ? ' is-ready' : ''}`}
          onPointerDown={(event) => {
            if (!imageSize.width) return
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, offset: boundedOffset }
          }}
          onPointerMove={moveImage}
          onPointerUp={() => { dragStart.current = null }}
          onPointerCancel={() => { dragStart.current = null }}
          onLostPointerCapture={() => { dragStart.current = null }}
          style={{ touchAction: 'none' }}
        >
          <img
            ref={imageRef}
            className="crop-image"
            src={image.dataUrl}
            alt={t('cropPreview')}
            draggable={false}
            onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            onError={() => setError(t('cropLoadError'))}
            style={imageSize.width ? {
              left: imageLeft,
              top: imageTop,
              width: displayWidth,
              height: displayHeight
            } : undefined}
          />
          {!imageSize.width && <span className="crop-loading"><ImagePlus size={22} /> {t('cropLoading')}</span>}
        </div>
        <div className="crop-zoom">
          <span>{t('cropZoom')}</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            disabled={!imageSize.width || saving}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom da imagem"
          />
          <span>{zoom.toFixed(1)}x</span>
          <button type="button" className="button button-quiet crop-reset" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }} disabled={!imageSize.width || saving}>
            <RotateCcw size={13} /> {t('cropReset')}
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer className="modal-footer">
          <button type="button" className="button button-quiet" onClick={onCancel} disabled={saving}>{t('cancel')}</button>
          <button type="button" className="button button-primary" onClick={() => void applyCrop()} disabled={!imageSize.width || saving}>
            {saving ? t('saving') : t('cropApply')}
          </button>
        </footer>
      </section>
    </div>
  )
}
