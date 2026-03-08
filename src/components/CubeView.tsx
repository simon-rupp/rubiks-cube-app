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
}

function FaceStickers({ face, stickers }: FaceStickersProps) {
  return (
    <div className="face-grid-3d" aria-label={`${face} face`}>
      {stickers.flatMap((stickerRow, row) =>
        stickerRow.map((sticker, col) => (
        <span
          className="sticker"
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

function getSwipeHighlightStyle(activeSwipe: ActiveSwipeFeedback): CSSProperties {
  const cellSize = 100 / 3
  if (activeSwipe.axis === 'horizontal') {
    return {
      top: `${activeSwipe.region.row * cellSize}%`,
      left: '0%',
      width: '100%',
      height: `${cellSize}%`,
    }
  }

  return {
    top: '0%',
    left: `${activeSwipe.region.col * cellSize}%`,
    width: `${cellSize}%`,
    height: '100%',
  }
}

const DIRECTION_GLYPHS = {
  left: '←',
  right: '→',
  up: '↑',
  down: '↓',
} as const

function getSwipeDirection(delta: number, axis: ActiveSwipeFeedback['axis']): keyof typeof DIRECTION_GLYPHS {
  if (axis === 'horizontal') {
    return delta >= 0 ? 'right' : 'left'
  }
  return delta >= 0 ? 'down' : 'up'
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

  return (
    <section className="cube-panel">
      <div className="cube-stage">
        <div
          className="cube-interaction"
          role="img"
          aria-label="3D Rubik's Cube interaction area"
          {...gestureSurfaceHandlers}
        >
          <div className="cube-3d" style={cubeStyle}>
            <div className="cube-face face-front">
              <FaceStickers face="F" stickers={faces.F} />
            </div>
            <div className="cube-face face-right">
              <FaceStickers face="R" stickers={faces.R} />
            </div>
            <div className="cube-face face-up">
              <FaceStickers face="U" stickers={faces.U} />
            </div>
            <div className="cube-face face-back">
              <FaceStickers face="B" stickers={faces.B} />
            </div>
            <div className="cube-face face-left">
              <FaceStickers face="L" stickers={faces.L} />
            </div>
            <div className="cube-face face-down">
              <FaceStickers face="D" stickers={faces.D} />
            </div>
          </div>

          {activeSwipe ? (
            <div className="swipe-overlay" aria-hidden="true">
              <div
                className={`swipe-highlight ${activeSwipe.axis}`}
                style={getSwipeHighlightStyle(activeSwipe)}
              />
              <p className="swipe-readout">
                {activeSwipe.label}{' '}
                {DIRECTION_GLYPHS[getSwipeDirection(activeSwipe.delta, activeSwipe.axis)]}
              </p>
            </div>
          ) : (
            <div className="swipe-overlay" aria-hidden="true" />
          )}
        </div>
      </div>

      {activeSwipe ? (
        <p className="status gesture">
          <strong>Swipe preview:</strong> {activeSwipe.label}
        </p>
      ) : null}

      <p className="status">
        <strong>Last action:</strong> {lastAction}
      </p>

      <p className="gesture-hint">
        Drag diagonally to rotate view. Swipe straight across rows/columns to make a move.
      </p>
    </section>
  )
}
