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
const CANCEL_FEEDBACK_DURATION_MS = 220
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
  phase: 'orbiting' | 'armed' | 'dragging' | 'cancelled'
  axis: SwipeAxis | null
  delta: number
  label: string | null
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

function buildOrbitingFeedback(distance: number): ActiveSwipeFeedback {
  return {
    phase: 'orbiting',
    axis: null,
    delta: distance,
    label: null,
    target: null,
  }
}

function buildArmedFeedback(target: SliceTarget | null): ActiveSwipeFeedback | null {
  if (!target) {
    return null
  }

  return {
    phase: 'armed',
    axis: null,
    delta: 0,
    label: null,
    target,
  }
}

function buildDraggingFeedback(
  target: SliceTarget | null,
  axis: SwipeAxis,
  delta: number,
  label: string,
): ActiveSwipeFeedback | null {
  if (!target) {
    return null
  }

  return {
    phase: 'dragging',
    axis,
    delta,
    label,
    target,
  }
}

function buildCancelledFeedback(tracking: TrackingState | null): ActiveSwipeFeedback | null {
  if (!tracking || !tracking.sliceTarget) {
    return null
  }

  if (tracking.mode === 'sliceArmed') {
    return {
      phase: 'cancelled',
      axis: null,
      delta: 0,
      label: null,
      target: tracking.sliceTarget,
    }
  }

  if (tracking.mode === 'sliceDragging') {
    return {
      phase: 'cancelled',
      axis: tracking.axis,
      delta: 0,
      label: null,
      target: tracking.sliceTarget,
    }
  }

  return null
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
  const cancelFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const clearCancelFeedbackTimeout = useCallback(() => {
    if (cancelFeedbackTimeoutRef.current === null) {
      return
    }

    clearTimeout(cancelFeedbackTimeoutRef.current)
    cancelFeedbackTimeoutRef.current = null
  }, [])

  const setLiveFeedback = useCallback(
    (feedback: ActiveSwipeFeedback | null) => {
      clearCancelFeedbackTimeout()
      setActiveSwipe(feedback)
    },
    [clearCancelFeedbackTimeout],
  )

  const releaseTracking = useCallback((target?: HTMLDivElement, nextFeedback?: ActiveSwipeFeedback | null) => {
    clearSliceArmTimeout()
    if (target && activePointerIdRef.current !== null) {
      safeReleasePointerCapture(target, activePointerIdRef.current)
    }
    activePointerIdRef.current = null
    trackingRef.current = null

    if (nextFeedback?.phase === 'cancelled') {
      clearCancelFeedbackTimeout()
      setActiveSwipe(nextFeedback)
      cancelFeedbackTimeoutRef.current = setTimeout(() => {
        setActiveSwipe((current) => {
          if (current?.phase !== 'cancelled') {
            return current
          }
          return null
        })
        cancelFeedbackTimeoutRef.current = null
      }, CANCEL_FEEDBACK_DURATION_MS)
      return
    }

    setLiveFeedback(nextFeedback ?? null)
  }, [clearCancelFeedbackTimeout, clearSliceArmTimeout, setLiveFeedback])

  const runHapticPulse = useCallback(() => {
    if (!hapticsEnabled) {
      return
    }

    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return
    }

    navigator.vibrate(profile.hapticPulseMs)
  }, [hapticsEnabled, profile.hapticPulseMs])

  const armSliceMode = useCallback(() => {
    const tracking = trackingRef.current
    if (!tracking || tracking.mode !== 'slicePress') {
      return
    }

    const deltaX = tracking.currentX - tracking.startX
    const deltaY = tracking.currentY - tracking.startY
    if (getPointerDistance(deltaX, deltaY) > profile.sliceArmDriftTolerancePx) {
      clearSliceArmTimeout()
      return
    }

    clearSliceArmTimeout()
    trackingRef.current = {
      ...tracking,
      mode: 'sliceArmed',
    }
    setLiveFeedback(buildArmedFeedback(tracking.sliceTarget))
    runHapticPulse()
  }, [
    clearSliceArmTimeout,
    profile.sliceArmDriftTolerancePx,
    runHapticPulse,
    setLiveFeedback,
  ])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    if (activePointerIdRef.current !== null) {
      releaseTracking(event.currentTarget, buildCancelledFeedback(trackingRef.current))
      return
    }

    if (event.pointerType === 'touch' && event.isPrimary === false) {
      return
    }

    setLiveFeedback(null)

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
      sliceArmTimeoutRef.current = setTimeout(armSliceMode, profile.sliceHoldDurationMs)
    }

    safeSetPointerCapture(target, pointerId)
  }, [armSliceMode, profile.sliceHoldDurationMs, releaseTracking, setLiveFeedback])

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
        if (distance > profile.sliceArmDriftTolerancePx) {
          clearSliceArmTimeout()
          tracking = {
            ...tracking,
            mode: 'orbiting',
            sliceTarget: null,
          }
          trackingRef.current = tracking
          setLiveFeedback(buildOrbitingFeedback(distance))
        } else if (event.timeStamp - tracking.pressedAt >= profile.sliceHoldDurationMs) {
          clearSliceArmTimeout()
          tracking = {
            ...tracking,
            mode: 'sliceArmed',
          }
          trackingRef.current = tracking
          setLiveFeedback(buildArmedFeedback(tracking.sliceTarget))
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
        setLiveFeedback(buildOrbitingFeedback(distance))
        return
      }

      if (tracking.mode === 'sliceArmed') {
        const axis = getDominantAxis(deltaX, deltaY)
        if (!axis) {
          setLiveFeedback(buildArmedFeedback(tracking.sliceTarget))
          return
        }

        const axisDelta = axis === 'horizontal' ? deltaX : deltaY
        const swipeMove = tracking.sliceTarget
          ? mapFaceLocalDragToMove(tracking.sliceTarget, axis, axisDelta)
          : null
        if (!swipeMove) {
          setLiveFeedback(buildArmedFeedback(tracking.sliceTarget))
          return
        }

        tracking = {
          ...tracking,
          mode: 'sliceDragging',
          axis,
        }
        trackingRef.current = tracking

        setLiveFeedback(
          buildDraggingFeedback(
            tracking.sliceTarget,
            axis,
            axisDelta,
            swipeMove.label,
          ),
        )
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
        setLiveFeedback(buildArmedFeedback(tracking.sliceTarget))
        return
      }

      setLiveFeedback(
        buildDraggingFeedback(
          tracking.sliceTarget,
          tracking.axis,
          axisDelta,
          swipeMove.label,
        ),
      )
    },
    [
      clearSliceArmTimeout,
      profile.rotateDegreesPerPixel,
      profile.sliceArmDriftTolerancePx,
      profile.sliceHoldDurationMs,
      profile.startThresholdPx,
      runHapticPulse,
      setLiveFeedback,
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

      let releaseFeedback: ActiveSwipeFeedback | null = null

      if (tracking.mode === 'sliceDragging') {
        const axisDelta = tracking.axis === 'horizontal' ? deltaX : deltaY
        const swipeMove = tracking.sliceTarget
          ? mapFaceLocalDragToMove(tracking.sliceTarget, tracking.axis, axisDelta)
          : null
        if (swipeMove && Math.abs(axisDelta) >= profile.commitThresholdPx) {
          onMove(swipeMove.move, swipeMove.label)
        } else {
          releaseFeedback = buildCancelledFeedback(tracking)
        }
      } else if (tracking.mode === 'sliceArmed') {
        releaseFeedback = buildCancelledFeedback(tracking)
      }

      releaseTracking(event.currentTarget, releaseFeedback)
    },
    [onMove, profile.commitThresholdPx, releaseTracking],
  )

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      releaseTracking(event.currentTarget, buildCancelledFeedback(trackingRef.current))
    },
    [releaseTracking],
  )

  const onLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      releaseTracking(event.currentTarget, buildCancelledFeedback(trackingRef.current))
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
