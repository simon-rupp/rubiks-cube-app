import { describe, expect, it } from 'vitest'
import {
  clampPitch,
  getAxisDelta,
  getGestureSensitivityProfile,
  getGestureTravelDistance,
  getDominantAxis,
  hasCrossedOrbitStartSlop,
  hasExceededSliceArmDriftTolerance,
  hasReachedSliceCommitDistance,
  mapFaceLocalDragToMove,
  mapPointToGridRegion,
  mapSwipeToMove,
  projectOrbitView,
} from './useCubeGestures.logic'

describe('useCubeGestures.logic', () => {
  it('clamps view pitch to configured bounds', () => {
    expect(clampPitch(-120)).toBe(-70)
    expect(clampPitch(120)).toBe(70)
    expect(clampPitch(18)).toBe(18)
  })

  it('maps points to front grid regions', () => {
    const bounds = { left: 100, top: 50, width: 300, height: 300 }

    expect(mapPointToGridRegion(110, 70, bounds)).toEqual({ row: 0, col: 0 })
    expect(mapPointToGridRegion(245, 195, bounds)).toEqual({ row: 1, col: 1 })
    expect(mapPointToGridRegion(395, 345, bounds)).toEqual({ row: 2, col: 2 })
  })

  it('detects dominant axis only for clear swipes', () => {
    expect(getDominantAxis(42, 8)).toBe('horizontal')
    expect(getDominantAxis(6, -40)).toBe('vertical')
    expect(getDominantAxis(24, 23)).toBeNull()
  })

  it('locks the phase-1 threshold defaults into sensitivity profiles', () => {
    expect(getGestureSensitivityProfile('low')).toMatchObject({
      orbitStartSlopPx: 12,
      sliceCommitDistancePx: 34,
      sliceHoldDurationMs: 180,
      sliceArmDriftTolerancePx: 10,
      hapticPulseMs: 12,
      startThresholdPx: 12,
      commitThresholdPx: 34,
    })

    expect(getGestureSensitivityProfile('medium')).toMatchObject({
      orbitStartSlopPx: 8,
      sliceCommitDistancePx: 26,
      sliceHoldDurationMs: 180,
      sliceArmDriftTolerancePx: 10,
      hapticPulseMs: 12,
      startThresholdPx: 8,
      commitThresholdPx: 26,
    })

    expect(getGestureSensitivityProfile('high')).toMatchObject({
      orbitStartSlopPx: 6,
      sliceCommitDistancePx: 20,
      sliceHoldDurationMs: 180,
      sliceArmDriftTolerancePx: 10,
      hapticPulseMs: 12,
      startThresholdPx: 6,
      commitThresholdPx: 20,
    })
  })

  it('exposes pure helpers for travel, drift, commit, and axis deltas', () => {
    const profile = getGestureSensitivityProfile('medium')

    expect(getGestureTravelDistance(6, 8)).toBe(10)
    expect(hasCrossedOrbitStartSlop(5, 7, profile.orbitStartSlopPx)).toBe(true)
    expect(hasCrossedOrbitStartSlop(3, 3, profile.orbitStartSlopPx)).toBe(false)
    expect(
      hasExceededSliceArmDriftTolerance(8, 7, profile.sliceArmDriftTolerancePx),
    ).toBe(true)
    expect(
      hasExceededSliceArmDriftTolerance(6, 8, profile.sliceArmDriftTolerancePx),
    ).toBe(false)
    expect(hasReachedSliceCommitDistance(-26, profile.sliceCommitDistancePx)).toBe(
      true,
    )
    expect(hasReachedSliceCommitDistance(25, profile.sliceCommitDistancePx)).toBe(
      false,
    )
    expect(getAxisDelta('horizontal', -18, 6)).toBe(-18)
    expect(getAxisDelta('vertical', -18, 6)).toBe(6)
  })

  it('projects orbit view updates using the pure orbit helper', () => {
    expect(projectOrbitView(-22, -24, 10, -5, 0.24)).toEqual({
      yaw: -19.6,
      pitch: -22.8,
    })

    expect(projectOrbitView(-22, -24, 0, 400, 0.24)).toEqual({
      yaw: -22,
      pitch: -70,
    })
  })

  it('maps horizontal row swipes to row moves', () => {
    expect(mapSwipeToMove({ row: 0, col: 1 }, 'horizontal', 30)).toMatchObject({
      move: "U'",
      label: 'Top row right',
    })
    expect(mapSwipeToMove({ row: 1, col: 1 }, 'horizontal', -30)).toMatchObject({
      move: "E'",
      label: 'Middle row left',
    })
    expect(mapSwipeToMove({ row: 2, col: 1 }, 'horizontal', 30)).toMatchObject({
      move: 'D',
      label: 'Bottom row right',
    })
  })

  it('maps vertical column swipes to column moves', () => {
    expect(mapSwipeToMove({ row: 1, col: 0 }, 'vertical', -30)).toMatchObject({
      move: "L'",
      label: 'Left column up',
    })
    expect(mapSwipeToMove({ row: 1, col: 1 }, 'vertical', -30)).toMatchObject({
      move: "M'",
      label: 'Middle column up',
    })
    expect(mapSwipeToMove({ row: 1, col: 1 }, 'vertical', 30)).toMatchObject({
      move: 'M',
      label: 'Middle column down',
    })
    expect(mapSwipeToMove({ row: 1, col: 2 }, 'vertical', -30)).toMatchObject({
      move: 'R',
      label: 'Right column up',
    })
    expect(mapSwipeToMove({ row: 1, col: 2 }, 'vertical', 30)).toMatchObject({
      move: "R'",
      label: 'Right column down',
    })
  })

  it('maps horizontal face-local drags on side faces to row moves', () => {
    expect(
      mapFaceLocalDragToMove({ face: 'R', row: 0, col: 1 }, 'horizontal', 30),
    ).toMatchObject({
      move: "U'",
      label: 'Top row right',
    })

    expect(
      mapFaceLocalDragToMove({ face: 'L', row: 1, col: 2 }, 'horizontal', -30),
    ).toMatchObject({
      move: "E'",
      label: 'Middle row left',
    })

    expect(
      mapFaceLocalDragToMove({ face: 'B', row: 2, col: 0 }, 'horizontal', 30),
    ).toMatchObject({
      move: 'D',
      label: 'Bottom row right',
    })
  })

  it('maps vertical face-local drags on top, front, down, and back faces', () => {
    expect(
      mapFaceLocalDragToMove({ face: 'U', row: 1, col: 0 }, 'vertical', -30),
    ).toMatchObject({
      move: "L'",
      label: 'Left column up',
    })

    expect(
      mapFaceLocalDragToMove({ face: 'D', row: 0, col: 1 }, 'vertical', 30),
    ).toMatchObject({
      move: 'M',
      label: 'Middle column down',
    })

    expect(
      mapFaceLocalDragToMove({ face: 'B', row: 1, col: 0 }, 'vertical', -30),
    ).toMatchObject({
      move: "R'",
      label: 'Left column up',
    })

    expect(
      mapFaceLocalDragToMove({ face: 'B', row: 1, col: 2 }, 'vertical', 30),
    ).toMatchObject({
      move: "L'",
      label: 'Right column down',
    })
  })

  it('rejects unsupported face-local axis combinations instead of guessing', () => {
    expect(
      mapFaceLocalDragToMove({ face: 'R', row: 1, col: 1 }, 'vertical', -30),
    ).toBeNull()
    expect(
      mapFaceLocalDragToMove({ face: 'U', row: 1, col: 1 }, 'horizontal', 30),
    ).toBeNull()
  })
})
