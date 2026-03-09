import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { ControlsPanel } from './components/ControlsPanel'
import { CubeView } from './components/CubeView'
import {
  COLUMN_CONTROLS,
  FACE_ORDER,
  ORIENTATION_CONTROLS,
  ROW_CONTROLS,
  SHORTCUTS,
} from './constants/cubeControls'
import { useCubeState } from './hooks/useCubeState'
import { useCubeGestures } from './hooks/useCubeGestures'
import type { GestureSensitivity } from './hooks/useCubeGestures.logic'
import type { Face } from './types/cube'

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

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function App() {
  const { facelets, lastAction, runMove, scramble, reset } = useCubeState()
  const [gestureSensitivity, setGestureSensitivity] =
    useState<GestureSensitivity>('medium')
  const [hapticsEnabled, setHapticsEnabled] = useState(true)

  const faces = useMemo(() => faceletsToFaces(facelets), [facelets])
  const { viewYaw, viewPitch, activeSwipe, gestureSurfaceHandlers } = useCubeGestures({
    onMove: runMove,
    sensitivity: gestureSensitivity,
    hapticsEnabled,
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isTextEditingTarget(event.target)
      ) {
        return
      }

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

  return (
    <div className="app-shell">
      <header className="topbar">
        <p>Rubik&apos;s Cube Controls MVP</p>
        <h1>Simple, Keyboard-First Cube Trainer</h1>
      </header>

      <main className="workspace">
        <section className="workspace-primary">
          <CubeView
            faces={faces}
            lastAction={lastAction}
            viewYaw={viewYaw}
            viewPitch={viewPitch}
            activeSwipe={activeSwipe}
            gestureSurfaceHandlers={gestureSurfaceHandlers}
          />
        </section>
        <aside className="workspace-controls">
          <ControlsPanel
            columnControls={COLUMN_CONTROLS}
            onMove={runMove}
            onReset={reset}
            onScramble={scramble}
            gestureSensitivity={gestureSensitivity}
            onGestureSensitivityChange={setGestureSensitivity}
            hapticsEnabled={hapticsEnabled}
            onHapticsToggle={setHapticsEnabled}
            orientationControls={ORIENTATION_CONTROLS}
            rowControls={ROW_CONTROLS}
          />
        </aside>
      </main>
    </div>
  )
}

export default App
