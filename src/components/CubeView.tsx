import type { CSSProperties } from 'react'
import { STICKER_COLORS } from '../constants/cubeControls'
import type { ActiveSwipeFeedback, GestureSurfaceHandlers } from '../hooks/useCubeGestures'
import type { Face } from '../types/cube'

type CubeViewProps = {
  faces: Record<Face, string[][]>
  lastAction: string
  viewYaw: number
  viewPitch: number
  activeSwipe: ActiveSwipeFeedback | null
  gestureSurfaceHandlers: GestureSurfaceHandlers
}

type FaceStickersProps = {
  face: Face
  stickers: string[][]
  activeSwipe: ActiveSwipeFeedback | null
}

function getStickerFeedbackClassName(
  face: Face,
  row: number,
  col: number,
  activeSwipe: ActiveSwipeFeedback | null,
): string {
  const classes = ['sticker']
  const target = activeSwipe?.target
  if (!target || face !== target.face) {
    return classes.join(' ')
  }

  const isTarget = row === target.row && col === target.col
  const isCandidate =
    activeSwipe.axis === 'horizontal'
      ? row === target.row
      : activeSwipe.axis === 'vertical'
        ? col === target.col
        : false

  if (activeSwipe.phase === 'armed' && isTarget) {
    classes.push('sticker-armed-target')
  }

  if (activeSwipe.phase === 'dragging') {
    if (isCandidate) {
      classes.push('sticker-candidate')
    }
    if (isTarget) {
      classes.push('sticker-candidate-target')
    }
  }

  if (activeSwipe.phase === 'cancelled') {
    if (isCandidate) {
      classes.push('sticker-cancelled')
    }
    if (isTarget) {
      classes.push('sticker-cancelled-target')
    }
  }

  return classes.join(' ')
}

function FaceStickers({ face, stickers, activeSwipe }: FaceStickersProps) {
  return (
    <div className="face-grid-3d" aria-label={`${face} face`}>
      {stickers.flatMap((stickerRow, row) =>
        stickerRow.map((sticker, col) => (
          <span
            className={getStickerFeedbackClassName(face, row, col, activeSwipe)}
            key={`${face}-${row}-${col}`}
            data-face={face}
            data-row={row}
            data-col={col}
            style={{ backgroundColor: STICKER_COLORS[sticker] ?? '#111827' }}
          />
        )),
      )}
    </div>
  )
}

const DIRECTION_GLYPHS = {
  left: '←',
  right: '→',
  up: '↑',
  down: '↓',
} as const

function getSwipeDirection(
  delta: number,
  axis: Exclude<ActiveSwipeFeedback['axis'], null>,
): keyof typeof DIRECTION_GLYPHS {
  if (axis === 'horizontal') {
    return delta >= 0 ? 'right' : 'left'
  }
  return delta >= 0 ? 'down' : 'up'
}

function getGestureReadout(activeSwipe: ActiveSwipeFeedback): string {
  if (activeSwipe.phase === 'orbiting') {
    return 'Orbiting view'
  }

  if (activeSwipe.phase === 'armed') {
    return 'Slice armed'
  }

  if (activeSwipe.phase === 'cancelled') {
    return 'Gesture cancelled'
  }

  if (!activeSwipe.label || !activeSwipe.axis) {
    return 'Slice preview'
  }

  return `${activeSwipe.label} ${
    DIRECTION_GLYPHS[getSwipeDirection(activeSwipe.delta, activeSwipe.axis)]
  }`
}

function getGestureHint(activeSwipe: ActiveSwipeFeedback | null): string {
  if (!activeSwipe) {
    return 'Drag the cube to orbit. Press and hold a visible sticker until it arms, then drag the highlighted row or column to turn.'
  }

  if (activeSwipe.phase === 'armed') {
    return 'Slice armed. Drag the highlighted row or column to turn, or release to cancel.'
  }

  if (activeSwipe.phase === 'dragging') {
    return 'Keep dragging along the highlighted row or column until the turn commits.'
  }

  if (activeSwipe.phase === 'cancelled') {
    return 'Slice cancelled. Drag the cube to orbit, or press and hold a sticker to try again.'
  }

  return 'Orbiting view. Release to stop, or press and hold a sticker next time to arm a turn.'
}

export function CubeView({
  faces,
  lastAction,
  viewYaw,
  viewPitch,
  activeSwipe,
  gestureSurfaceHandlers,
}: CubeViewProps) {
  const cubeStyle = {
    '--view-yaw': `${viewYaw}deg`,
    '--view-pitch': `${viewPitch}deg`,
  } as CSSProperties
  const gestureReadout = activeSwipe ? getGestureReadout(activeSwipe) : null
  const gestureHint = getGestureHint(activeSwipe)
  const interactionClassName =
    activeSwipe?.phase === 'orbiting'
      ? 'cube-interaction is-orbiting'
      : 'cube-interaction'

  return (
    <section className="cube-panel">
      <div className="cube-stage">
        <div
          className={interactionClassName}
          role="img"
          aria-label="3D Rubik's Cube interaction area"
          data-gesture-phase={activeSwipe?.phase ?? 'idle'}
          {...gestureSurfaceHandlers}
        >
          <div className="cube-3d" style={cubeStyle}>
            <div className="cube-face face-front">
              <FaceStickers face="F" stickers={faces.F} activeSwipe={activeSwipe} />
            </div>
            <div className="cube-face face-right">
              <FaceStickers face="R" stickers={faces.R} activeSwipe={activeSwipe} />
            </div>
            <div className="cube-face face-up">
              <FaceStickers face="U" stickers={faces.U} activeSwipe={activeSwipe} />
            </div>
            <div className="cube-face face-back">
              <FaceStickers face="B" stickers={faces.B} activeSwipe={activeSwipe} />
            </div>
            <div className="cube-face face-left">
              <FaceStickers face="L" stickers={faces.L} activeSwipe={activeSwipe} />
            </div>
            <div className="cube-face face-down">
              <FaceStickers face="D" stickers={faces.D} activeSwipe={activeSwipe} />
            </div>
          </div>

          {gestureReadout ? (
            <div className={`swipe-overlay phase-${activeSwipe?.phase}`} aria-hidden="true">
              <p className={`swipe-readout phase-${activeSwipe?.phase}`}>
                {gestureReadout}
              </p>
            </div>
          ) : (
            <div className="swipe-overlay" aria-hidden="true" />
          )}
        </div>
      </div>

      {gestureReadout ? (
        <p className="status gesture">
          <strong>Gesture:</strong> {gestureReadout}
        </p>
      ) : null}

      <p className="status">
        <strong>Last action:</strong> {lastAction}
      </p>

      <p className="gesture-hint">
        {gestureHint}
      </p>
    </section>
  )
}
