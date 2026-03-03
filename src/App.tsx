import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cube from 'cubejs'
import './App.css'

type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B'

type DirectionButton = {
  label: string
  keyHint: string
  move: string
}

type RowControl = {
  row: string
  left: DirectionButton
  right: DirectionButton
}

type ColumnControl = {
  column: string
  up: DirectionButton
  down: DirectionButton
}

type Shortcut =
  | { type: 'move'; label: string; move: string }
  | { type: 'scramble' }
  | { type: 'reset' }

const FACE_ORDER: Face[] = ['U', 'R', 'F', 'D', 'L', 'B']

const STICKER_COLORS: Record<string, string> = {
  U: '#f8fafc',
  R: '#ef4444',
  F: '#16a34a',
  D: '#facc15',
  L: '#f97316',
  B: '#2563eb',
}

const ORIENTATION_CONTROLS: DirectionButton[] = [
  { label: 'Turn Left', keyHint: 'Arrow Left', move: "y'" },
  { label: 'Turn Right', keyHint: 'Arrow Right', move: 'y' },
  { label: 'Turn Up', keyHint: 'Arrow Up', move: 'x' },
  { label: 'Turn Down', keyHint: 'Arrow Down', move: "x'" },
]

const ROW_CONTROLS: RowControl[] = [
  {
    row: 'Top row',
    left: { label: 'Left', keyHint: 'Q', move: "U'" },
    right: { label: 'Right', keyHint: 'W', move: 'U' },
  },
  {
    row: 'Middle row',
    left: { label: 'Left', keyHint: 'A', move: 'E' },
    right: { label: 'Right', keyHint: 'S', move: "E'" },
  },
  {
    row: 'Bottom row',
    left: { label: 'Left', keyHint: 'Z', move: 'D' },
    right: { label: 'Right', keyHint: 'X', move: "D'" },
  },
]

const COLUMN_CONTROLS: ColumnControl[] = [
  {
    column: 'Left column',
    up: { label: 'Up', keyHint: 'U', move: 'L' },
    down: { label: 'Down', keyHint: 'J', move: "L'" },
  },
  {
    column: 'Middle column',
    up: { label: 'Up', keyHint: 'I', move: "M'" },
    down: { label: 'Down', keyHint: 'K', move: 'M' },
  },
  {
    column: 'Right column',
    up: { label: 'Up', keyHint: 'O', move: "R'" },
    down: { label: 'Down', keyHint: 'L', move: 'R' },
  },
]

const SHORTCUTS: Record<string, Shortcut> = {
  ArrowLeft: { type: 'move', label: 'Turn Left', move: "y'" },
  ArrowRight: { type: 'move', label: 'Turn Right', move: 'y' },
  ArrowUp: { type: 'move', label: 'Turn Up', move: 'x' },
  ArrowDown: { type: 'move', label: 'Turn Down', move: "x'" },
  q: { type: 'move', label: 'Top row left', move: "U'" },
  w: { type: 'move', label: 'Top row right', move: 'U' },
  a: { type: 'move', label: 'Middle row left', move: 'E' },
  s: { type: 'move', label: 'Middle row right', move: "E'" },
  z: { type: 'move', label: 'Bottom row left', move: 'D' },
  x: { type: 'move', label: 'Bottom row right', move: "D'" },
  u: { type: 'move', label: 'Left column up', move: 'L' },
  j: { type: 'move', label: 'Left column down', move: "L'" },
  i: { type: 'move', label: 'Middle column up', move: "M'" },
  k: { type: 'move', label: 'Middle column down', move: 'M' },
  o: { type: 'move', label: 'Right column up', move: "R'" },
  l: { type: 'move', label: 'Right column down', move: 'R' },
  ' ': { type: 'scramble' },
  r: { type: 'reset' },
}

function faceletsToFaces(facelets: string): Record<Face, string[][]> {
  const byFace = {} as Record<Face, string[][]>
  let cursor = 0

  for (const face of FACE_ORDER) {
    const stickers = facelets.slice(cursor, cursor + 9).split('')
    byFace[face] = [
      stickers.slice(0, 3),
      stickers.slice(3, 6),
      stickers.slice(6, 9),
    ]
    cursor += 9
  }

  return byFace
}

function App() {
  const cubeRef = useRef(new Cube())
  const [facelets, setFacelets] = useState<string>(() => cubeRef.current.asString())
  const [lastAction, setLastAction] = useState('Ready')

  const faces = useMemo(() => faceletsToFaces(facelets), [facelets])

  const refresh = useCallback((label: string) => {
    setFacelets(cubeRef.current.asString())
    setLastAction(label)
  }, [])

  const runMove = useCallback(
    (move: string, label: string) => {
      cubeRef.current.move(move)
      refresh(`${label} (${move})`)
    },
    [refresh],
  )

  const scramble = useCallback(() => {
    cubeRef.current.randomize()
    refresh('Scrambled')
  }, [refresh])

  const reset = useCallback(() => {
    cubeRef.current.identity()
    refresh('Reset to solved state')
  }, [refresh])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      const shortcut = SHORTCUTS[key]
      if (!shortcut) {
        return
      }

      event.preventDefault()
      if (shortcut.type === 'move') {
        runMove(shortcut.move, shortcut.label)
        return
      }

      if (shortcut.type === 'scramble') {
        scramble()
        return
      }

      reset()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [reset, runMove, scramble])

  const renderFaceStickers = (face: Face) => (
    <div className="face-grid-3d" aria-label={`${face} face`}>
      {faces[face].flat().map((sticker, index) => (
        <span
          className="sticker"
          key={`${face}-${index}`}
          style={{ backgroundColor: STICKER_COLORS[sticker] ?? '#111827' }}
        />
      ))}
    </div>
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <p>Rubik&apos;s Cube Controls MVP</p>
        <h1>Simple, Keyboard-First Cube Trainer</h1>
      </header>

      <main className="workspace">
        <section className="cube-panel">
          <div className="cube-stage" role="img" aria-label="3D Rubik's Cube">
            <div className="cube-3d">
              <div className="cube-face face-front">{renderFaceStickers('F')}</div>
              <div className="cube-face face-right">{renderFaceStickers('R')}</div>
              <div className="cube-face face-up">{renderFaceStickers('U')}</div>
              <div className="cube-face face-back">{renderFaceStickers('B')}</div>
              <div className="cube-face face-left">{renderFaceStickers('L')}</div>
              <div className="cube-face face-down">{renderFaceStickers('D')}</div>
            </div>
          </div>

          <p className="status">
            <strong>Last action:</strong> {lastAction}
          </p>
        </section>

        <section className="controls-panel">
          <section className="control-card">
            <h2>Session</h2>
            <div className="button-row">
              <button onClick={scramble}>
                Scramble <kbd>Space</kbd>
              </button>
              <button onClick={reset}>
                Reset <kbd>R</kbd>
              </button>
            </div>
          </section>

          <section className="control-card">
            <h2>Turn Cube</h2>
            <div className="button-grid orientation">
              {ORIENTATION_CONTROLS.map((control) => (
                <button
                  key={control.label}
                  onClick={() => runMove(control.move, control.label)}
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
              {ROW_CONTROLS.map((control) => (
                <div className="layer-row" key={control.row}>
                  <p>{control.row}</p>
                  <button onClick={() => runMove(control.left.move, `${control.row} left`)}>
                    {control.left.label}
                    <small>
                      {control.left.keyHint} · {control.left.move}
                    </small>
                  </button>
                  <button
                    onClick={() => runMove(control.right.move, `${control.row} right`)}
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
              {COLUMN_CONTROLS.map((control) => (
                <div className="layer-row" key={control.column}>
                  <p>{control.column}</p>
                  <button onClick={() => runMove(control.up.move, `${control.column} up`)}>
                    {control.up.label}
                    <small>
                      {control.up.keyHint} · {control.up.move}
                    </small>
                  </button>
                  <button
                    onClick={() => runMove(control.down.move, `${control.column} down`)}
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
            <h2>Touchscreen First Pass</h2>
            <p>
              Buttons are sized for touch targets on mobile (44px+). Gesture swipes can
              be added next as phase 2.
            </p>
          </section>
        </section>
      </main>
    </div>
  )
}

export default App
