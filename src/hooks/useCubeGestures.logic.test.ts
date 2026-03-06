import { describe, expect, it } from 'vitest'
import {
  clampPitch,
  getDominantAxis,
  mapPointToGridRegion,
  mapSwipeToMove,
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

  it('maps horizontal row swipes to row moves', () => {
    expect(mapSwipeToMove({ row: 0, col: 1 }, 'horizontal', 30)).toMatchObject({
      move: 'U',
      label: 'Top row right',
    })
    expect(mapSwipeToMove({ row: 1, col: 1 }, 'horizontal', -30)).toMatchObject({
      move: 'E',
      label: 'Middle row left',
    })
    expect(mapSwipeToMove({ row: 2, col: 1 }, 'horizontal', 30)).toMatchObject({
      move: "D'",
      label: 'Bottom row right',
    })
  })

  it('maps vertical column swipes to column moves', () => {
    expect(mapSwipeToMove({ row: 1, col: 0 }, 'vertical', -30)).toMatchObject({
      move: 'L',
      label: 'Left column up',
    })
    expect(mapSwipeToMove({ row: 1, col: 1 }, 'vertical', 30)).toMatchObject({
      move: 'M',
      label: 'Middle column down',
    })
    expect(mapSwipeToMove({ row: 1, col: 2 }, 'vertical', -30)).toMatchObject({
      move: "R'",
      label: 'Right column up',
    })
  })
})
