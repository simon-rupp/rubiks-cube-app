export type GestureSensitivity = 'low' | 'medium' | 'high'
export type SwipeAxis = 'horizontal' | 'vertical'
export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export type GridRegion = {
  row: 0 | 1 | 2
  col: 0 | 1 | 2
}

export type BoundsRect = {
  left: number
  top: number
  width: number
  height: number
}

export type SwipeMove = {
  move: string
  label: string
  direction: SwipeDirection
  axis: SwipeAxis
  region: GridRegion
}

export const ROW_LABELS = ['Top row', 'Middle row', 'Bottom row'] as const
export const COLUMN_LABELS = ['Left column', 'Middle column', 'Right column'] as const

export const VIEW_PITCH_MIN = -70
export const VIEW_PITCH_MAX = 70

export const GESTURE_SENSITIVITY_PROFILES = {
  low: {
    startThresholdPx: 14,
    commitThresholdPx: 38,
    rotateDegreesPerPixel: 0.2,
  },
  medium: {
    startThresholdPx: 10,
    commitThresholdPx: 26,
    rotateDegreesPerPixel: 0.24,
  },
  high: {
    startThresholdPx: 8,
    commitThresholdPx: 20,
    rotateDegreesPerPixel: 0.28,
  },
} as const

function clampUnit(value: number): number {
  if (value < 0) {
    return 0
  }
  if (value > 0.999_999) {
    return 0.999_999
  }
  return value
}

function clampGridIndex(value: number): 0 | 1 | 2 {
  if (value < 0) {
    return 0
  }
  if (value > 2) {
    return 2
  }
  return value as 0 | 1 | 2
}

export function clampPitch(pitch: number): number {
  return Math.min(VIEW_PITCH_MAX, Math.max(VIEW_PITCH_MIN, pitch))
}

export function mapPointToGridRegion(
  pointX: number,
  pointY: number,
  bounds: BoundsRect,
): GridRegion {
  const normalizedX = clampUnit((pointX - bounds.left) / bounds.width)
  const normalizedY = clampUnit((pointY - bounds.top) / bounds.height)

  return {
    row: clampGridIndex(Math.floor(normalizedY * 3)),
    col: clampGridIndex(Math.floor(normalizedX * 3)),
  }
}

export function getDominantAxis(
  deltaX: number,
  deltaY: number,
  ratioThreshold = 1.25,
): SwipeAxis | null {
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  const dominant = Math.max(absX, absY)
  const secondary = Math.min(absX, absY)

  if (dominant < 0.01) {
    return null
  }

  if (secondary <= 0.01 || dominant / secondary >= ratioThreshold) {
    return absX >= absY ? 'horizontal' : 'vertical'
  }

  return null
}

export function directionFromDelta(axis: SwipeAxis, delta: number): SwipeDirection {
  if (axis === 'horizontal') {
    return delta >= 0 ? 'right' : 'left'
  }
  return delta >= 0 ? 'down' : 'up'
}

export function describeSwipeIntent(
  region: GridRegion,
  axis: SwipeAxis,
  delta: number,
): string {
  const direction = directionFromDelta(axis, delta)
  if (axis === 'horizontal') {
    return `${ROW_LABELS[region.row]} ${direction}`
  }
  return `${COLUMN_LABELS[region.col]} ${direction}`
}

export function mapSwipeToMove(
  region: GridRegion,
  axis: SwipeAxis,
  delta: number,
): SwipeMove {
  const direction = directionFromDelta(axis, delta)

  if (axis === 'horizontal') {
    const leftMoves = ['U', "E'", "D'"]
    const rightMoves = ["U'", 'E', 'D']
    const move = direction === 'right' ? rightMoves[region.row] : leftMoves[region.row]

    return {
      move,
      label: `${ROW_LABELS[region.row]} ${direction}`,
      direction,
      axis,
      region,
    }
  }

  const upMoves = ["L'", "M'", 'R']
  const downMoves = ['L', 'M', "R'"]
  const move = direction === 'up' ? upMoves[region.col] : downMoves[region.col]

  return {
    move,
    label: `${COLUMN_LABELS[region.col]} ${direction}`,
    direction,
    axis,
    region,
  }
}
