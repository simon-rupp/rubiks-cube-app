import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { MoveHandler } from '../types/cube'
import type { Face } from '../types/cube'
import {
  clampPitch,
  GESTURE_SENSITIVITY_PROFILES,
  getDominantAxis,
  mapFaceLocalDragToMove,
  mapPointToGridRegion,
  type FaceGridTarget,
  type GestureSensitivity,
  type GridRegion,
  type SwipeAxis,
} from './useCubeGestures.logic'

const DEFAULT_VIEW_YAW = -22
const DEFAULT_VIEW_PITCH = -24
const SLICE_HOLD_DURATION_MS = 180
const SLICE_PRESS_DRIFT_TOLERANCE_PX = 10
const VALID_FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B']

export type SliceTarget = FaceGridTarget

type TrackingStateBase = {
  pointerId: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  startYaw: number
  startPitch: number
  region: GridRegion
  sliceTarget: SliceTarget | null
}

type OrbitCandidateState = TrackingStateBase & {
  mode: 'orbitCandidate'
}

type OrbitingState = TrackingStateBase & {
  mode: 'orbiting'
}

type SlicePressState = TrackingStateBase & {
  mode: 'slicePress'
  pressedAt: number
}

type SliceArmedState = TrackingStateBase & {
  mode: 'sliceArmed'
}

type SliceDraggingState = TrackingStateBase & {
  mode: 'sliceDragging'
  axis: SwipeAxis
}

type TrackingState =
  | OrbitCandidateState
  | OrbitingState
  | SlicePressState
  | SliceArmedState
  | SliceDraggingState

export type ActiveSwipeFeedback = {
  axis: SwipeAxis
  region: GridRegion
  delta: number
  label: string
  target: SliceTarget | null
}

type UseCubeGesturesOptions = {
  onMove: MoveHandler
  sensitivity: GestureSensitivity
  hapticsEnabled: boolean
}

export type GestureSurfaceHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void
}

type UseCubeGesturesResult = {
  viewYaw: number
  viewPitch: number
  activeSwipe: ActiveSwipeFeedback | null
  gestureSurfaceHandlers: GestureSurfaceHandlers
}

function isDifferentActivePointer(eventPointerId: number, activePointerId: number | null): boolean {
  if (activePointerId === null) {
    return false
  }

  if (eventPointerId <= 0 || activePointerId <= 0) {
    return false
  }

  return eventPointerId !== activePointerId
}

function isFace(value: string | undefined): value is Face {
  return value !== undefined && VALID_FACES.includes(value as Face)
}

function parseGridIndex(value: string | undefined): 0 | 1 | 2 | null {
  if (value === '0' || value === '1' || value === '2') {
    return Number(value) as 0 | 1 | 2
  }

  return null
}

function getSliceTarget(target: EventTarget | null): SliceTarget | null {
  if (!(target instanceof Element)) {
    return null
  }

  const sticker = target.closest<HTMLElement>('.sticker')
  if (!sticker) {
    return null
  }

  const { face, row, col } = sticker.dataset
  if (!isFace(face)) {
    return null
  }

  const parsedRow = parseGridIndex(row)
  const parsedCol = parseGridIndex(col)
  if (parsedRow === null || parsedCol === null) {
    return null
  }

  return {
    face,
    row: parsedRow,
    col: parsedCol,
  }
}

function getPointerDistance(deltaX: number, deltaY: number): number {
  return Math.hypot(deltaX, deltaY)
}

function safeSetPointerCapture(target: HTMLDivElement, pointerId: number): void {
  if (typeof target.setPointerCapture !== 'function') {
    return
  }

  try {
    target.setPointerCapture(pointerId)
  } catch {
    // Ignore if browser cannot capture (e.g. synthetic events in tests).
  }
}

function safeReleasePointerCapture(target: HTMLDivElement, pointerId: number): void {
  if (typeof target.releasePointerCapture !== 'function') {
    return
  }

  try {
    target.releasePointerCapture(pointerId)
  } catch {
    // Ignore if pointer capture was already released or unsupported.
  }
}

export function useCubeGestures({
  onMove,
  sensitivity,
  hapticsEnabled,
}: UseCubeGesturesOptions): UseCubeGesturesResult {
  const [viewYaw, setViewYaw] = useState(DEFAULT_VIEW_YAW)
  const [viewPitch, setViewPitch] = useState(DEFAULT_VIEW_PITCH)
  const [activeSwipe, setActiveSwipe] = useState<ActiveSwipeFeedback | null>(null)

  const viewYawRef = useRef(viewYaw)
  const viewPitchRef = useRef(viewPitch)
  const activePointerIdRef = useRef<number | null>(null)
  const trackingRef = useRef<TrackingState | null>(null)
  const sliceArmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    viewYawRef.current = viewYaw
  }, [viewYaw])

  useEffect(() => {
    viewPitchRef.current = viewPitch
  }, [viewPitch])

  const profile = useMemo(() => GESTURE_SENSITIVITY_PROFILES[sensitivity], [sensitivity])

  const clearSliceArmTimeout = useCallback(() => {
    if (sliceArmTimeoutRef.current === null) {
      return
    }

    clearTimeout(sliceArmTimeoutRef.current)
    sliceArmTimeoutRef.current = null
  }, [])

  const releaseTracking = useCallback((target?: HTMLDivElement) => {
    clearSliceArmTimeout()
    if (target && activePointerIdRef.current !== null) {
      safeReleasePointerCapture(target, activePointerIdRef.current)
    }
    activePointerIdRef.current = null
    trackingRef.current = null
    setActiveSwipe(null)
  }, [clearSliceArmTimeout])

  const runHapticPulse = useCallback(() => {
    if (!hapticsEnabled) {
      return
    }

    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return
    }

    navigator.vibrate(12)
  }, [hapticsEnabled])

  const armSliceMode = useCallback(() => {
    const tracking = trackingRef.current
    if (!tracking || tracking.mode !== 'slicePress') {
      return
    }

    const deltaX = tracking.currentX - tracking.startX
    const deltaY = tracking.currentY - tracking.startY
    if (getPointerDistance(deltaX, deltaY) > SLICE_PRESS_DRIFT_TOLERANCE_PX) {
      clearSliceArmTimeout()
      return
    }

    clearSliceArmTimeout()
    trackingRef.current = {
      ...tracking,
      mode: 'sliceArmed',
    }
    runHapticPulse()
  }, [clearSliceArmTimeout, runHapticPulse])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    if (activePointerIdRef.current !== null) {
      releaseTracking(event.currentTarget)
      return
    }

    if (event.pointerType === 'touch' && event.isPrimary === false) {
      return
    }

    const target = event.currentTarget
    const bounds = target.getBoundingClientRect()
    const sliceTarget = getSliceTarget(event.target)
    const region = sliceTarget
      ? { row: sliceTarget.row, col: sliceTarget.col }
      : mapPointToGridRegion(event.clientX, event.clientY, bounds)

    const pointerId = event.pointerId > 0 ? event.pointerId : 1
    activePointerIdRef.current = pointerId
    trackingRef.current = sliceTarget
      ? {
          mode: 'slicePress',
          pointerId,
          startX: event.clientX,
          startY: event.clientY,
          currentX: event.clientX,
          currentY: event.clientY,
          startYaw: viewYawRef.current,
          startPitch: viewPitchRef.current,
          region,
          sliceTarget,
          pressedAt: event.timeStamp,
        }
      : {
          mode: 'orbitCandidate',
          pointerId,
          startX: event.clientX,
          startY: event.clientY,
          currentX: event.clientX,
          currentY: event.clientY,
          startYaw: viewYawRef.current,
          startPitch: viewPitchRef.current,
          region,
          sliceTarget: null,
        }

    if (sliceTarget) {
      sliceArmTimeoutRef.current = setTimeout(armSliceMode, SLICE_HOLD_DURATION_MS)
    }

    safeSetPointerCapture(target, pointerId)
  }, [armSliceMode, releaseTracking])

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      let tracking = trackingRef.current
      if (!tracking) {
        return
      }

      if (isDifferentActivePointer(event.pointerId, activePointerIdRef.current)) {
        return
      }

      tracking.currentX = event.clientX
      tracking.currentY = event.clientY

      const deltaX = event.clientX - tracking.startX
      const deltaY = event.clientY - tracking.startY
      const distance = getPointerDistance(deltaX, deltaY)

      if (tracking.mode === 'slicePress') {
        if (distance > SLICE_PRESS_DRIFT_TOLERANCE_PX) {
          clearSliceArmTimeout()
          tracking = {
            ...tracking,
            mode: 'orbiting',
            sliceTarget: null,
          }
          trackingRef.current = tracking
        } else if (event.timeStamp - tracking.pressedAt >= SLICE_HOLD_DURATION_MS) {
          clearSliceArmTimeout()
          tracking = {
            ...tracking,
            mode: 'sliceArmed',
          }
          trackingRef.current = tracking
          runHapticPulse()
        } else {
          return
        }
      }

      if (tracking.mode === 'orbitCandidate') {
        if (distance < profile.startThresholdPx) {
          return
        }

        tracking = {
          ...tracking,
          mode: 'orbiting',
        }
        trackingRef.current = tracking
      }

      if (tracking.mode === 'orbiting') {
        const yaw = tracking.startYaw + deltaX * profile.rotateDegreesPerPixel
        const pitch = clampPitch(
          tracking.startPitch - deltaY * profile.rotateDegreesPerPixel,
        )

        viewYawRef.current = yaw
        viewPitchRef.current = pitch
        setViewYaw(yaw)
        setViewPitch(pitch)
        setActiveSwipe(null)
        return
      }

      if (tracking.mode === 'sliceArmed') {
        const axis = getDominantAxis(deltaX, deltaY)
        if (!axis) {
          setActiveSwipe(null)
          return
        }

        const axisDelta = axis === 'horizontal' ? deltaX : deltaY
        const swipeMove = tracking.sliceTarget
          ? mapFaceLocalDragToMove(tracking.sliceTarget, axis, axisDelta)
          : null
        if (!swipeMove) {
          setActiveSwipe(null)
          return
        }

        tracking = {
          ...tracking,
          mode: 'sliceDragging',
          axis,
        }
        trackingRef.current = tracking

        setActiveSwipe({
          axis,
          region: tracking.region,
          delta: axisDelta,
          label: swipeMove.label,
          target: tracking.sliceTarget,
        })
        return
      }

      if (tracking.mode !== 'sliceDragging') {
        return
      }

      const axisDelta = tracking.axis === 'horizontal' ? deltaX : deltaY
      const swipeMove = tracking.sliceTarget
        ? mapFaceLocalDragToMove(tracking.sliceTarget, tracking.axis, axisDelta)
        : null
      if (!swipeMove) {
        setActiveSwipe(null)
        return
      }

      setActiveSwipe({
        axis: tracking.axis,
        region: tracking.region,
        delta: axisDelta,
        label: swipeMove.label,
        target: tracking.sliceTarget,
      })
    },
    [
      clearSliceArmTimeout,
      profile.rotateDegreesPerPixel,
      profile.startThresholdPx,
      runHapticPulse,
    ],
  )

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const tracking = trackingRef.current
      if (!tracking) {
        return
      }

      if (isDifferentActivePointer(event.pointerId, activePointerIdRef.current)) {
        return
      }

      const deltaX = event.clientX - tracking.startX
      const deltaY = event.clientY - tracking.startY

      if (tracking.mode === 'sliceDragging') {
        const axisDelta = tracking.axis === 'horizontal' ? deltaX : deltaY
        const swipeMove = tracking.sliceTarget
          ? mapFaceLocalDragToMove(tracking.sliceTarget, tracking.axis, axisDelta)
          : null
        if (swipeMove && Math.abs(axisDelta) >= profile.commitThresholdPx) {
          onMove(swipeMove.move, swipeMove.label)
        }
      }

      releaseTracking(event.currentTarget)
    },
    [onMove, profile.commitThresholdPx, releaseTracking],
  )

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      releaseTracking(event.currentTarget)
    },
    [releaseTracking],
  )

  const onLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      releaseTracking(event.currentTarget)
    },
    [releaseTracking],
  )

  return {
    viewYaw,
    viewPitch,
    activeSwipe,
    gestureSurfaceHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture,
    },
  }
}
