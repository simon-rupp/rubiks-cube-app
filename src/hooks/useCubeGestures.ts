import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { MoveHandler } from '../types/cube'
import {
  clampPitch,
  describeSwipeIntent,
  GESTURE_SENSITIVITY_PROFILES,
  getDominantAxis,
  mapPointToGridRegion,
  mapSwipeToMove,
  type GestureSensitivity,
  type GridRegion,
  type SwipeAxis,
} from './useCubeGestures.logic'

const DEFAULT_VIEW_YAW = -22
const DEFAULT_VIEW_PITCH = -24

type GestureMode = 'tracking' | 'rotateView' | 'sliceSwipe'

type TrackingState = {
  mode: GestureMode
  pointerId: number
  startX: number
  startY: number
  startYaw: number
  startPitch: number
  region: GridRegion
  axis: SwipeAxis | null
}

export type ActiveSwipeFeedback = {
  axis: SwipeAxis
  region: GridRegion
  delta: number
  label: string
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

  useEffect(() => {
    viewYawRef.current = viewYaw
  }, [viewYaw])

  useEffect(() => {
    viewPitchRef.current = viewPitch
  }, [viewPitch])

  const profile = useMemo(() => GESTURE_SENSITIVITY_PROFILES[sensitivity], [sensitivity])

  const releaseTracking = useCallback((target?: HTMLDivElement) => {
    if (target && activePointerIdRef.current !== null) {
      safeReleasePointerCapture(target, activePointerIdRef.current)
    }
    activePointerIdRef.current = null
    trackingRef.current = null
    setActiveSwipe(null)
  }, [])

  const runHapticPulse = useCallback(() => {
    if (!hapticsEnabled) {
      return
    }

    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return
    }

    navigator.vibrate(12)
  }, [hapticsEnabled])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || activePointerIdRef.current !== null) {
      return
    }

    if (event.pointerType === 'touch' && event.isPrimary === false) {
      return
    }

    const target = event.currentTarget
    const bounds = target.getBoundingClientRect()
    const region = mapPointToGridRegion(event.clientX, event.clientY, bounds)

    const pointerId = event.pointerId > 0 ? event.pointerId : 1
    activePointerIdRef.current = pointerId
    trackingRef.current = {
      mode: 'tracking',
      pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startYaw: viewYawRef.current,
      startPitch: viewPitchRef.current,
      region,
      axis: null,
    }

    safeSetPointerCapture(target, pointerId)
  }, [])

  const onPointerMove = useCallback(
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
      const distance = Math.hypot(deltaX, deltaY)

      if (tracking.mode === 'tracking') {
        if (distance < profile.startThresholdPx) {
          return
        }

        const axis = getDominantAxis(deltaX, deltaY)
        if (axis) {
          tracking.mode = 'sliceSwipe'
          tracking.axis = axis
        } else {
          tracking.mode = 'rotateView'
        }
      }

      if (tracking.mode === 'rotateView') {
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

      if (tracking.mode === 'sliceSwipe' && tracking.axis) {
        const axisDelta = tracking.axis === 'horizontal' ? deltaX : deltaY
        setActiveSwipe({
          axis: tracking.axis,
          region: tracking.region,
          delta: axisDelta,
          label: describeSwipeIntent(tracking.region, tracking.axis, axisDelta),
        })
      }
    },
    [profile.rotateDegreesPerPixel, profile.startThresholdPx],
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

      if (tracking.mode === 'sliceSwipe' && tracking.axis) {
        const axisDelta = tracking.axis === 'horizontal' ? deltaX : deltaY
        if (Math.abs(axisDelta) >= profile.commitThresholdPx) {
          const swipeMove = mapSwipeToMove(tracking.region, tracking.axis, axisDelta)
          onMove(swipeMove.move, swipeMove.label)
          runHapticPulse()
        }
      }

      releaseTracking(event.currentTarget)
    },
    [onMove, profile.commitThresholdPx, releaseTracking, runHapticPulse],
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
