import { useEffect, useId, useRef, useState } from 'react'
import { type HeadingColor, headingColor, headingColorCss, relativeLuminance } from './noteAppearance'

const SWATCHES = [
  ['Indigo', '#6757c7'],
  ['Blue', '#19589f'],
  ['Teal', '#147864'],
  ['Rose', '#ad3563'],
] as const

function contrastRatio(foreground: string, background: string): number | null {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.fillStyle = background
  context.fillRect(0, 0, 1, 1)
  const [br, bg, bb] = context.getImageData(0, 0, 1, 1).data
  context.fillStyle = foreground
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  const base = relativeLuminance(br, bg, bb)
  const front = relativeLuminance(r, g, b)
  return (Math.max(base, front) + .05) / (Math.min(base, front) + .05)
}

export default function SettingsColor({ label, value, onChange, disabled, allowAccent = true, checkContrast = false }: {
  label: string
  value: HeadingColor
  onChange: (color: HeadingColor) => void
  disabled?: boolean
  allowAccent?: boolean
  checkContrast?: boolean
}) {
  const id = useId()
  const custom = value !== 'theme' && value !== 'accent'
  const [hex, setHex] = useState(custom ? value : '')
  const [contrast, setContrast] = useState<number | null>(null)
  const probe = useRef<HTMLSpanElement>(null)
  useEffect(() => setHex(custom ? value : ''), [value, custom])
  useEffect(() => {
    const node = probe.current
    if (!node || value === 'theme' || disabled) return
    const measure = () => {
      const style = getComputedStyle(node)
      setContrast(contrastRatio(style.color, style.backgroundColor))
    }
    measure()
    const observer = new MutationObserver(measure)
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-color-scheme'] })
    }
    const scheme = matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', measure)
    return () => {
      observer.disconnect()
      scheme.removeEventListener('change', measure)
    }
  }, [disabled, value])

  const invalid = custom && !/^#?[0-9a-f]{6}$/i.test(hex)
  const lowContrast = checkContrast && value !== 'theme' && !disabled && contrast !== null && contrast < 4.5

  return (
    <div className="qz-settings-color-field">
      <div className="qz-settings-color-mode">
        <label className="qz-field">{label}
          <select className="qz-input" value={custom ? 'custom' : value} disabled={disabled}
            aria-describedby={lowContrast ? `${id}-contrast` : undefined}
            onChange={event => onChange(event.currentTarget.value === 'custom' ? '#6757c7' : headingColor(event.currentTarget.value))}>
            <option value="theme">Theme default</option>
            {allowAccent && <option value="accent">Theme accent</option>}
            <option value="custom">Custom color</option>
          </select>
        </label>
        <button className="qz-button" data-variant="quiet" type="button" disabled={disabled || value === 'theme'}
          aria-label={`Reset ${label.toLowerCase()}`} onClick={() => onChange('theme')}>Reset</button>
      </div>
      {custom && <>
        <div className="qz-settings-color-mode">
          <label className="qz-field">Hex color
            <input className="qz-input qz-mono" aria-label={`${label} hex`} value={hex} disabled={disabled}
              placeholder="#6757c7" maxLength={7} spellCheck={false}
              aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-format` : undefined}
              onChange={event => {
                const next = event.currentTarget.value
                setHex(next)
                const match = next.match(/^#?([0-9a-f]{6})$/i)
                if (match) onChange(headingColor(`#${match[1].toLowerCase()}`))
              }} />
          </label>
          <input className="qz-input" type="color" aria-label={`Custom ${label.toLowerCase()}`}
            value={value} disabled={disabled} onChange={event => onChange(headingColor(event.currentTarget.value))} />
        </div>
        {invalid && <p id={`${id}-format`} className="qz-muted">Use six hexadecimal digits, for example #6757c7.</p>}
        <div className="qz-color-swatches" role="group" aria-label={`${label} swatches`}>
          {SWATCHES.map(([name, color]) => <button key={color} type="button" title={name}
            aria-label={name} aria-pressed={value === color} disabled={disabled} style={{ backgroundColor: color }}
            onClick={() => onChange(color)} />)}
        </div>
      </>}
      {checkContrast && <span hidden ref={probe} style={{ color: headingColorCss(value), backgroundColor: 'var(--qz-canvas)' }} />}
      {lowContrast && <p id={`${id}-contrast`} className="qz-notice" role="status">
        Low contrast on the current background ({contrast.toFixed(2)}:1). Aim for at least 4.5:1.
      </p>}
    </div>
  )
}
