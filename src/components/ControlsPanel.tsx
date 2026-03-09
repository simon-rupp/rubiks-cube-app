import { useEffect, useState } from 'react'
import type {
  ColumnControl,
  DirectionButton,
  MoveHandler,
  RowControl,
} from '../types/cube'
import type { GestureSensitivity } from '../hooks/useCubeGestures.logic'

const MOBILE_SECONDARY_CONTROLS_QUERY = '(max-width: 620px)'

type ControlsPanelProps = {
  orientationControls: DirectionButton[]
  rowControls: RowControl[]
  columnControls: ColumnControl[]
  onMove: MoveHandler
  onScramble: () => void
  onReset: () => void
  gestureSensitivity: GestureSensitivity
  onGestureSensitivityChange: (value: GestureSensitivity) => void
  hapticsEnabled: boolean
  onHapticsToggle: (enabled: boolean) => void
}

export function ControlsPanel({
  orientationControls,
  rowControls,
  columnControls,
  onMove,
  onScramble,
  onReset,
  gestureSensitivity,
  onGestureSensitivityChange,
  hapticsEnabled,
  onHapticsToggle,
}: ControlsPanelProps) {
  const [secondaryControlsOpen, setSecondaryControlsOpen] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true
    }

    return !window.matchMedia(MOBILE_SECONDARY_CONTROLS_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(MOBILE_SECONDARY_CONTROLS_QUERY)
    const syncToViewport = (matches: boolean) => {
      setSecondaryControlsOpen(!matches)
    }
    const handleChange = (event: MediaQueryListEvent) => {
      syncToViewport(event.matches)
    }

    syncToViewport(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <section className="controls-panel">
      <section className="control-card session-card">
        <h2>Session</h2>
        <div className="button-row">
          <button type="button" onClick={onScramble}>
            Scramble <kbd>Space</kbd>
          </button>
          <button type="button" onClick={onReset}>
            Reset <kbd>R</kbd>
          </button>
        </div>
      </section>

      <section className="control-card touch-guide-card">
        <h2>Quick Touch Guide</h2>
        <p>
          Orbit the cube with a normal drag. Press and hold a visible sticker until
          it arms, then drag the highlighted row or column to turn.
        </p>
      </section>

      <section
        className="control-card secondary-controls-card"
        data-secondary-open={secondaryControlsOpen ? 'true' : 'false'}
      >
        <div className="secondary-controls-header">
          <div>
            <h2>Secondary Controls</h2>
            <p>
              Keep fallback controls nearby, but tuck them behind a single mobile
              section so the cube and session flow stay primary.
            </p>
          </div>
          <button
            type="button"
            className="secondary-controls-toggle"
            aria-expanded={secondaryControlsOpen}
            onClick={() => setSecondaryControlsOpen((current) => !current)}
          >
            {secondaryControlsOpen ? 'Hide secondary controls' : 'Show secondary controls'}
          </button>
        </div>

        {secondaryControlsOpen ? (
          <div className="secondary-controls-grid">
            <section className="secondary-control-section orientation-card">
              <h3>Turn Cube</h3>
              <div className="button-grid orientation">
                {orientationControls.map((control) => (
                  <button
                    type="button"
                    key={control.label}
                    onClick={() => onMove(control.move, control.label)}
                  >
                    {control.label}
                    <small>
                      {control.keyHint} · {control.move}
                    </small>
                  </button>
                ))}
              </div>
            </section>

            <section className="secondary-control-section row-controls-card">
              <h3>Move Rows (Left/Right)</h3>
              <div className="layer-grid">
                {rowControls.map((control) => (
                  <div className="layer-row" key={control.row}>
                    <p>{control.row}</p>
                    <button
                      type="button"
                      onClick={() => onMove(control.left.move, `${control.row} left`)}
                    >
                      {control.left.label}
                      <small>
                        {control.left.keyHint} · {control.left.move}
                      </small>
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(control.right.move, `${control.row} right`)}
                    >
                      {control.right.label}
                      <small>
                        {control.right.keyHint} · {control.right.move}
                      </small>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="secondary-control-section column-controls-card">
              <h3>Move Columns (Up/Down)</h3>
              <div className="layer-grid">
                {columnControls.map((control) => (
                  <div className="layer-row" key={control.column}>
                    <p>{control.column}</p>
                    <button
                      type="button"
                      onClick={() => onMove(control.up.move, `${control.column} up`)}
                    >
                      {control.up.label}
                      <small>
                        {control.up.keyHint} · {control.up.move}
                      </small>
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(control.down.move, `${control.column} down`)}
                    >
                      {control.down.label}
                      <small>
                        {control.down.keyHint} · {control.down.move}
                      </small>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="secondary-control-section touch-settings-card">
              <h3>Touch Settings</h3>
              <p>
                Keep the cube and quick guide as the primary mobile flow. These
                settings only tune orbit slop, turn commit distance, and optional arm
                feedback.
              </p>
              <label className="touch-option">
                <span>Sensitivity</span>
                <select
                  value={gestureSensitivity}
                  onChange={(event) =>
                    onGestureSensitivityChange(event.target.value as GestureSensitivity)
                  }
                >
                  <option value="low">Low (stable)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (quick)</option>
                </select>
              </label>
              <label className="touch-option checkbox">
                <input
                  type="checkbox"
                  checked={hapticsEnabled}
                  onChange={(event) => onHapticsToggle(event.target.checked)}
                />
                <span>Pulse when slice mode arms (if supported)</span>
              </label>
            </section>
          </div>
        ) : (
          <p className="secondary-controls-preview">
            Orientation buttons, row and column shortcuts, sensitivity, and haptics
            stay available here when you need the fallback controls.
          </p>
        )}
      </section>
    </section>
  )
}
