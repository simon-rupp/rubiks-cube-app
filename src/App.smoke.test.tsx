import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

function mockMatchMedia(initialMatches: boolean) {
  const originalMatchMedia = window.matchMedia
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const mediaQuery = {
    matches: initialMatches,
    media: '(max-width: 620px)',
    onchange: null,
    addEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') {
        listeners.add(listener)
      }
    }),
    removeEventListener: vi.fn(
      (type: string, listener: (event: MediaQueryListEvent) => void) => {
        if (type === 'change') {
          listeners.delete(listener)
        }
      },
    ),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => mediaQuery),
  })

  return {
    restore: () => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      })
    },
  }
}

function mockInteractionBounds(element: HTMLElement): void {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 300,
    bottom: 300,
    width: 300,
    height: 300,
    toJSON: () => ({}),
  } as DOMRect)
}

function getLastActionStatus(): HTMLElement {
  const label = screen.getByText(/last action:/i)
  const status = label.closest('p')
  if (!status) {
    throw new Error('Missing last action status element')
  }
  return status
}

function getGestureStatus(): HTMLElement {
  const label = screen.getByText(/gesture:/i)
  const status = label.closest('p')
  if (!status) {
    throw new Error('Missing gesture status element')
  }
  return status
}

function getLayerRow(label: RegExp): HTMLElement {
  const rowLabel = screen.getByText(label)
  const row = rowLabel.closest('.layer-row')
  if (!(row instanceof HTMLElement)) {
    throw new Error(`Missing layer row for ${label.toString()}`)
  }
  return row
}

function getSecondaryControlsCard(): HTMLElement {
  const heading = screen.getByRole('heading', { name: /secondary controls/i })
  const card = heading.closest('.secondary-controls-card')
  if (!(card instanceof HTMLElement)) {
    throw new Error('Missing secondary controls card')
  }
  return card
}

function getFrontSticker(interaction: HTMLElement): HTMLElement {
  const sticker = interaction.querySelector('.face-front .sticker')
  if (!(sticker instanceof HTMLElement)) {
    throw new Error('Missing front-face sticker target')
  }
  return sticker
}

function getFaceSticker(
  interaction: HTMLElement,
  faceClass: string,
  index: number,
): HTMLElement {
  const stickers = interaction.querySelectorAll<HTMLElement>(`${faceClass} .sticker`)
  const sticker = stickers[index]
  if (!(sticker instanceof HTMLElement)) {
    throw new Error(`Missing sticker ${index} for ${faceClass}`)
  }
  return sticker
}

function getCubeElement(interaction: HTMLElement): HTMLElement {
  const cube = interaction.querySelector('.cube-3d')
  if (!(cube instanceof HTMLElement)) {
    throw new Error('Missing cube element')
  }
  return cube
}

function expectRenderedBefore(first: HTMLElement, second: HTMLElement): void {
  expect(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
}

function mockNavigatorVibrate() {
  const originalVibrate = navigator.vibrate
  const vibrate = vi.fn()

  Object.defineProperty(window.navigator, 'vibrate', {
    configurable: true,
    value: vibrate,
  })

  return {
    vibrate,
    restore: () => {
      Object.defineProperty(window.navigator, 'vibrate', {
        configurable: true,
        value: originalVibrate,
      })
    },
  }
}

describe('App smoke flows', () => {
  it('handles scramble and reset from control buttons', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /scramble/i }))
    expect(getLastActionStatus()).toHaveTextContent('Scrambled')

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(getLastActionStatus()).toHaveTextContent('Reset to solved state')
  })

  it('maps left/right keyboard turns to expected orientation semantics', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(getLastActionStatus()).toHaveTextContent('Turn Left (y)')

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(getLastActionStatus()).toHaveTextContent("Turn Right (y')")
  })

  it('maps left/right orientation buttons to expected turn directions', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /turn left/i }))
    expect(getLastActionStatus()).toHaveTextContent('Turn Left (y)')

    fireEvent.click(screen.getByRole('button', { name: /turn right/i }))
    expect(getLastActionStatus()).toHaveTextContent("Turn Right (y')")
  })

  it('still supports reset keyboard shortcut', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: 'r' })
    expect(getLastActionStatus()).toHaveTextContent('Reset to solved state')
  })

  it('still supports scramble keyboard shortcut', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: ' ' })
    expect(getLastActionStatus()).toHaveTextContent('Scrambled')
  })

  it('maps middle-column keyboard shortcuts to expected directions', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: 'i' })
    expect(getLastActionStatus()).toHaveTextContent("Middle column up (M')")

    fireEvent.keyDown(window, { key: 'k' })
    expect(getLastActionStatus()).toHaveTextContent('Middle column down (M)')
  })

  it('maps middle-column buttons to expected directions', () => {
    render(<App />)

    const middleColumnRow = getLayerRow(/middle column/i)
    fireEvent.click(within(middleColumnRow).getByRole('button', { name: /up/i }))
    expect(getLastActionStatus()).toHaveTextContent("Middle column up (M')")

    fireEvent.click(within(middleColumnRow).getByRole('button', { name: /down/i }))
    expect(getLastActionStatus()).toHaveTextContent('Middle column down (M)')
  })

  it('maps left-column keyboard shortcuts to expected directions', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: 'u' })
    expect(getLastActionStatus()).toHaveTextContent("Left column up (L')")

    fireEvent.keyDown(window, { key: 'j' })
    expect(getLastActionStatus()).toHaveTextContent('Left column down (L)')
  })

  it('maps left-column buttons to expected directions', () => {
    render(<App />)

    const leftColumnRow = getLayerRow(/left column/i)
    fireEvent.click(within(leftColumnRow).getByRole('button', { name: /up/i }))
    expect(getLastActionStatus()).toHaveTextContent("Left column up (L')")

    fireEvent.click(within(leftColumnRow).getByRole('button', { name: /down/i }))
    expect(getLastActionStatus()).toHaveTextContent('Left column down (L)')
  })

  it('maps top-row keyboard shortcuts to expected directions', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: 'q' })
    expect(getLastActionStatus()).toHaveTextContent('Top row left (U)')

    fireEvent.keyDown(window, { key: 'w' })
    expect(getLastActionStatus()).toHaveTextContent("Top row right (U')")
  })

  it('maps top-row buttons to expected directions', () => {
    render(<App />)

    const topRow = getLayerRow(/top row/i)
    fireEvent.click(within(topRow).getByRole('button', { name: /left/i }))
    expect(getLastActionStatus()).toHaveTextContent('Top row left (U)')

    fireEvent.click(within(topRow).getByRole('button', { name: /right/i }))
    expect(getLastActionStatus()).toHaveTextContent("Top row right (U')")
  })

  it('renders session actions and quick touch guidance before dense move grids', () => {
    render(<App />)

    const sessionHeading = screen.getByRole('heading', { name: /session/i })
    const guideHeading = screen.getByRole('heading', { name: /quick touch guide/i })
    const turnHeading = screen.getByRole('heading', { name: /turn cube/i })
    const rowsHeading = screen.getByRole('heading', { name: /move rows/i })
    const columnsHeading = screen.getByRole('heading', { name: /move columns/i })

    expectRenderedBefore(sessionHeading, turnHeading)
    expectRenderedBefore(guideHeading, turnHeading)
    expectRenderedBefore(guideHeading, rowsHeading)
    expectRenderedBefore(guideHeading, columnsHeading)
  })

  it('collapses fallback controls behind a single mobile toggle', () => {
    const matchMedia = mockMatchMedia(true)

    try {
      render(<App />)

      const toggle = screen.getByRole('button', { name: /show secondary controls/i })
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByText(/when you need the fallback controls/i)).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /turn cube/i })).not.toBeInTheDocument()

      fireEvent.click(toggle)

      expect(
        screen.getByRole('button', { name: /hide secondary controls/i }),
      ).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('heading', { name: /turn cube/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /move rows/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /move columns/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /touch settings/i })).toBeInTheDocument()
    } finally {
      matchMedia.restore()
    }
  })

  it('keeps desktop fallback sections grouped inside the secondary controls card', () => {
    const matchMedia = mockMatchMedia(false)

    try {
      render(<App />)

      const secondaryCard = getSecondaryControlsCard()

      expect(secondaryCard).toHaveAttribute('data-secondary-open', 'true')
      expect(
        within(secondaryCard).getByRole('button', { name: /hide secondary controls/i }),
      ).toHaveAttribute('aria-expanded', 'true')
      expect(
        within(secondaryCard).queryByText(/when you need the fallback controls/i),
      ).not.toBeInTheDocument()

      expect(
        within(secondaryCard).getByText(/keep fallback controls nearby/i),
      ).toBeInTheDocument()
      expect(
        within(secondaryCard).getByRole('heading', { name: /turn cube/i }),
      ).toBeInTheDocument()
      expect(
        within(secondaryCard).getByRole('heading', { name: /move rows/i }),
      ).toBeInTheDocument()
      expect(
        within(secondaryCard).getByRole('heading', { name: /move columns/i }),
      ).toBeInTheDocument()
      expect(
        within(secondaryCard).getByRole('heading', { name: /touch settings/i }),
      ).toBeInTheDocument()
      expect(within(secondaryCard).getAllByRole('heading', { level: 3 })).toHaveLength(4)
    } finally {
      matchMedia.restore()
    }
  })

  it('supports orbiting from a direct drag on the cube surface', () => {
    render(<App />)

    const interaction = screen.getByRole('img', { name: /interaction area/i })
    mockInteractionBounds(interaction)

    fireEvent.pointerDown(interaction, {
      pointerId: 1,
      clientX: 120,
      clientY: 120,
      button: 0,
      isPrimary: true,
    })
    fireEvent.pointerMove(interaction, {
      pointerId: 1,
      clientX: 150,
      clientY: 120,
      isPrimary: true,
    })
    expect(getGestureStatus()).toHaveTextContent('Orbiting view')
    fireEvent.pointerUp(interaction, {
      pointerId: 1,
      clientX: 150,
      clientY: 120,
      isPrimary: true,
    })

    const cube = interaction.querySelector('.cube-3d')
    expect(cube).not.toBeNull()
    expect(cube?.getAttribute('style')).toContain('--view-yaw')
    expect(cube?.getAttribute('style')).not.toContain('--view-yaw: -22deg')
    expect(screen.queryByText(/gesture:/i)).not.toBeInTheDocument()
  })

  it('emits face and sticker coordinates on visible sticker targets', () => {
    render(<App />)

    const interaction = screen.getByRole('img', { name: /interaction area/i })
    const frontTopLeft = getFaceSticker(interaction, '.face-front', 0)
    const frontCenter = getFaceSticker(interaction, '.face-front', 4)
    const rightTopLeft = getFaceSticker(interaction, '.face-right', 0)

    expect(frontTopLeft.dataset.face).toBe('F')
    expect(frontTopLeft.dataset.row).toBe('0')
    expect(frontTopLeft.dataset.col).toBe('0')

    expect(frontCenter.dataset.face).toBe('F')
    expect(frontCenter.dataset.row).toBe('1')
    expect(frontCenter.dataset.col).toBe('1')

    expect(rightTopLeft.dataset.face).toBe('R')
    expect(rightTopLeft.dataset.row).toBe('0')
    expect(rightTopLeft.dataset.col).toBe('0')
  })

  it('shows armed feedback on the touched sticker after the hold completes', () => {
    vi.useFakeTimers()

    try {
      render(<App />)

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFrontSticker(interaction)

      fireEvent.pointerDown(sticker, {
        pointerId: 8,
        clientX: 72,
        clientY: 70,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(getGestureStatus()).toHaveTextContent('Slice armed')
      expect(sticker).toHaveClass('sticker-armed-target')
    } finally {
      vi.useRealTimers()
    }
  })

  it('pulses haptics when slice mode arms and the toggle is enabled', () => {
    vi.useFakeTimers()
    const { vibrate, restore } = mockNavigatorVibrate()

    try {
      render(<App />)

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFrontSticker(interaction)

      fireEvent.pointerDown(sticker, {
        pointerId: 9,
        clientX: 72,
        clientY: 70,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(vibrate).toHaveBeenCalledTimes(1)
      expect(vibrate).toHaveBeenCalledWith(12)
    } finally {
      restore()
      vi.useRealTimers()
    }
  })

  it('does not pulse haptics when the toggle is off', () => {
    vi.useFakeTimers()
    const { vibrate, restore } = mockNavigatorVibrate()

    try {
      render(<App />)

      fireEvent.click(screen.getByLabelText(/pulse when slice mode arms/i))

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFrontSticker(interaction)

      fireEvent.pointerDown(sticker, {
        pointerId: 10,
        clientX: 72,
        clientY: 70,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(vibrate).not.toHaveBeenCalled()
    } finally {
      restore()
      vi.useRealTimers()
    }
  })

  it('supports hold-to-slice moves on the cube surface', () => {
    vi.useFakeTimers()

    try {
      render(<App />)

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFrontSticker(interaction)

      fireEvent.pointerDown(sticker, {
        pointerId: 2,
        clientX: 72,
        clientY: 70,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      fireEvent.pointerMove(interaction, {
        pointerId: 2,
        clientX: 126,
        clientY: 76,
        isPrimary: true,
      })
      fireEvent.pointerUp(interaction, {
        pointerId: 2,
        clientX: 126,
        clientY: 76,
        isPrimary: true,
      })

      expect(getLastActionStatus()).toHaveTextContent("Top row right (U')")
    } finally {
      vi.useRealTimers()
    }
  })

  it('supports hold-to-column moves on the cube surface', () => {
    vi.useFakeTimers()

    try {
      render(<App />)

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFaceSticker(interaction, '.face-front', 3)

      fireEvent.pointerDown(sticker, {
        pointerId: 11,
        clientX: 72,
        clientY: 170,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      fireEvent.pointerMove(interaction, {
        pointerId: 11,
        clientX: 76,
        clientY: 122,
        isPrimary: true,
      })
      fireEvent.pointerUp(interaction, {
        pointerId: 11,
        clientX: 76,
        clientY: 122,
        isPrimary: true,
      })

      expect(getLastActionStatus()).toHaveTextContent("Left column up (L')")
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancels slice arming on early drift and falls back to orbiting', () => {
    vi.useFakeTimers()

    try {
      render(<App />)

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFrontSticker(interaction)

      fireEvent.pointerDown(sticker, {
        pointerId: 3,
        clientX: 72,
        clientY: 70,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      fireEvent.pointerMove(interaction, {
        pointerId: 3,
        clientX: 112,
        clientY: 70,
        isPrimary: true,
      })
      fireEvent.pointerUp(interaction, {
        pointerId: 3,
        clientX: 112,
        clientY: 70,
        isPrimary: true,
      })

      expect(getLastActionStatus()).toHaveTextContent('Ready')
      expect(getCubeElement(interaction).getAttribute('style')).not.toContain(
        '--view-yaw: -22deg',
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not commit when an armed slice is released before commit distance', () => {
    vi.useFakeTimers()

    try {
      render(<App />)

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFrontSticker(interaction)

      fireEvent.pointerDown(sticker, {
        pointerId: 4,
        clientX: 72,
        clientY: 70,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      fireEvent.pointerMove(interaction, {
        pointerId: 4,
        clientX: 92,
        clientY: 74,
        isPrimary: true,
      })
      fireEvent.pointerUp(interaction, {
        pointerId: 4,
        clientX: 92,
        clientY: 74,
        isPrimary: true,
      })

      expect(getLastActionStatus()).toHaveTextContent('Ready')
      expect(getGestureStatus()).toHaveTextContent('Gesture cancelled')

      act(() => {
        vi.advanceTimersByTime(250)
      })

      expect(screen.queryByText(/gesture:/i)).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears armed slice state on lost pointer capture', () => {
    vi.useFakeTimers()

    try {
      render(<App />)

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFrontSticker(interaction)

      fireEvent.pointerDown(sticker, {
        pointerId: 5,
        clientX: 72,
        clientY: 70,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      fireEvent.pointerMove(interaction, {
        pointerId: 5,
        clientX: 126,
        clientY: 76,
        isPrimary: true,
      })
      expect(getGestureStatus()).toHaveTextContent('Top row right')

      fireEvent.lostPointerCapture(interaction, {
        pointerId: 5,
        isPrimary: true,
      })
      fireEvent.pointerUp(interaction, {
        pointerId: 5,
        clientX: 126,
        clientY: 76,
        isPrimary: true,
      })

      expect(getLastActionStatus()).toHaveTextContent('Ready')
      expect(getGestureStatus()).toHaveTextContent('Gesture cancelled')

      act(() => {
        vi.advanceTimersByTime(250)
      })

      expect(screen.queryByText(/gesture:/i)).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('aborts the active gesture when a second pointer starts', () => {
    vi.useFakeTimers()

    try {
      render(<App />)

      const interaction = screen.getByRole('img', { name: /interaction area/i })
      mockInteractionBounds(interaction)
      const sticker = getFrontSticker(interaction)

      fireEvent.pointerDown(sticker, {
        pointerId: 6,
        clientX: 72,
        clientY: 70,
        button: 0,
        isPrimary: true,
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      fireEvent.pointerDown(interaction, {
        pointerId: 7,
        clientX: 140,
        clientY: 140,
        button: 0,
        isPrimary: true,
      })

      fireEvent.pointerMove(interaction, {
        pointerId: 6,
        clientX: 126,
        clientY: 76,
        isPrimary: true,
      })
      fireEvent.pointerUp(interaction, {
        pointerId: 6,
        clientX: 126,
        clientY: 76,
        isPrimary: true,
      })

      expect(getLastActionStatus()).toHaveTextContent('Ready')
      expect(getGestureStatus()).toHaveTextContent('Gesture cancelled')

      act(() => {
        vi.advanceTimersByTime(250)
      })

      expect(screen.queryByText(/gesture:/i)).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
