import type {
  ColumnControl,
  DirectionButton,
  MoveHandler,
  RowControl,
} from '../types/cube'
import type { GestureSensitivity } from '../hooks/useCubeGestures.logic'

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
  return (
    <section className="controls-panel">
      <section className="control-card">
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

      <section className="control-card">
        <h2>Turn Cube</h2>
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

      <section className="control-card">
        <h2>Move Rows (Left/Right)</h2>
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

      <section className="control-card">
        <h2>Move Columns (Up/Down)</h2>
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

      <section className="control-card">
        <h2>Touch Controls</h2>
        <p>Swipe rows/columns on the cube. Drag diagonally to rotate the view.</p>
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
          <span>Haptic feedback (if supported)</span>
        </label>
      </section>
    </section>
  )
}
