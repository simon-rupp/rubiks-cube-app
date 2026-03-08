import type { Face } from '../types/cube'

export type GestureSensitivity = 'low' | 'medium' | 'high'
export type SwipeAxis = 'horizontal' | 'vertical'
export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export type GestureSensitivityProfile = {
  orbitStartSlopPx: number
  sliceCommitDistancePx: number
  sliceHoldDurationMs: number
  sliceArmDriftTolerancePx: number
  rotateDegreesPerPixel: number
  hapticPulseMs: number
  startThresholdPx: number
  commitThresholdPx: number
}

export type GridRegion = {
  row: 0 | 1 | 2
  col: 0 | 1 | 2
}

export type FaceGridTarget = GridRegion & {
  face: Face
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

export const GESTURE_SENSITIVITY_PROFILES: Record<
  GestureSensitivity,
  GestureSensitivityProfile
> = {
  low: {
    orbitStartSlopPx: 12,
    sliceCommitDistancePx: 34,
    sliceHoldDurationMs: 180,
    sliceArmDriftTolerancePx: 10,
    rotateDegreesPerPixel: 0.2,
    hapticPulseMs: 12,
    startThresholdPx: 12,
    commitThresholdPx: 34,
  },
  medium: {
    orbitStartSlopPx: 8,
    sliceCommitDistancePx: 26,
    sliceHoldDurationMs: 180,
    sliceArmDriftTolerancePx: 10,
    rotateDegreesPerPixel: 0.24,
    hapticPulseMs: 12,
    startThresholdPx: 8,
    commitThresholdPx: 26,
  },
  high: {
    orbitStartSlopPx: 6,
    sliceCommitDistancePx: 20,
    sliceHoldDurationMs: 180,
    sliceArmDriftTolerancePx: 10,
    commitThresholdPx: 20,
    rotateDegreesPerPixel: 0.28,
    hapticPulseMs: 12,
    startThresholdPx: 6,
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

export function getGestureSensitivityProfile(
  sensitivity: GestureSensitivity,
): GestureSensitivityProfile {
  return GESTURE_SENSITIVITY_PROFILES[sensitivity]
}

export function getGestureTravelDistance(deltaX: number, deltaY: number): number {
  return Math.hypot(deltaX, deltaY)
}

export function getAxisDelta(
  axis: SwipeAxis,
  deltaX: number,
  deltaY: number,
): number {
  return axis === 'horizontal' ? deltaX : deltaY
}

export function hasCrossedOrbitStartSlop(
  deltaX: number,
  deltaY: number,
  orbitStartSlopPx: number,
): boolean {
  return getGestureTravelDistance(deltaX, deltaY) >= orbitStartSlopPx
}

export function hasExceededSliceArmDriftTolerance(
  deltaX: number,
  deltaY: number,
  sliceArmDriftTolerancePx: number,
): boolean {
  return getGestureTravelDistance(deltaX, deltaY) > sliceArmDriftTolerancePx
}

export function hasReachedSliceCommitDistance(
  axisDelta: number,
  sliceCommitDistancePx: number,
): boolean {
  return Math.abs(axisDelta) >= sliceCommitDistancePx
}

export function projectOrbitView(
  startYaw: number,
  startPitch: number,
  deltaX: number,
  deltaY: number,
  rotateDegreesPerPixel: number,
): { yaw: number; pitch: number } {
  return {
    yaw: startYaw + deltaX * rotateDegreesPerPixel,
    pitch: clampPitch(startPitch - deltaY * rotateDegreesPerPixel),
  }
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
  return mapSwipeToMove(region, axis, delta).label
}

const HORIZONTAL_LEFT_MOVES = ['U', "E'", "D'"] as const
const HORIZONTAL_RIGHT_MOVES = ["U'", 'E', 'D'] as const
const VERTICAL_UP_MOVES = ["L'", "M'", 'R'] as const
const VERTICAL_DOWN_MOVES = ['L', 'M', "R'"] as const
const BACK_FACE_VERTICAL_UP_MOVES = ["R'", 'M', 'L'] as const
const BACK_FACE_VERTICAL_DOWN_MOVES = ['R', "M'", "L'"] as const

function supportsHorizontalFaceLocalDrag(face: Face): boolean {
  return face === 'F' || face === 'R' || face === 'L' || face === 'B'
}

function supportsVerticalFaceLocalDrag(face: Face): boolean {
  return face === 'F' || face === 'U' || face === 'D' || face === 'B'
}

export function mapFaceLocalDragToMove(
  target: FaceGridTarget,
  axis: SwipeAxis,
  delta: number,
): SwipeMove | null {
  const direction = directionFromDelta(axis, delta)

  if (axis === 'horizontal') {
    if (!supportsHorizontalFaceLocalDrag(target.face)) {
      return null
    }

    const move =
      direction === 'right'
        ? HORIZONTAL_RIGHT_MOVES[target.row]
        : HORIZONTAL_LEFT_MOVES[target.row]

    return {
      move,
      label: `${ROW_LABELS[target.row]} ${direction}`,
      direction,
      axis,
      region: {
        row: target.row,
        col: target.col,
      },
    }
  }

  if (!supportsVerticalFaceLocalDrag(target.face)) {
    return null
  }

  const moveTable =
    target.face === 'B'
      ? direction === 'up'
        ? BACK_FACE_VERTICAL_UP_MOVES
        : BACK_FACE_VERTICAL_DOWN_MOVES
      : direction === 'up'
        ? VERTICAL_UP_MOVES
        : VERTICAL_DOWN_MOVES

  return {
    move: moveTable[target.col],
    label: `${COLUMN_LABELS[target.col]} ${direction}`,
    direction,
    axis,
    region: {
      row: target.row,
      col: target.col,
    },
  }
}

export function mapSwipeToMove(
  region: GridRegion,
  axis: SwipeAxis,
  delta: number,
): SwipeMove {
  const swipeMove = mapFaceLocalDragToMove(
    {
      face: 'F',
      row: region.row,
      col: region.col,
    },
    axis,
    delta,
  )
  if (!swipeMove) {
    throw new Error('Front-face drag mapping unexpectedly failed')
  }

  return swipeMove
}
