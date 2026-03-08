import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

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

function getLayerRow(label: RegExp): HTMLElement {
  const rowLabel = screen.getByText(label)
  const row = rowLabel.closest('.layer-row')
  if (!(row instanceof HTMLElement)) {
    throw new Error(`Missing layer row for ${label.toString()}`)
  }
  return row
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
      expect(screen.queryByText(/swipe preview:/i)).not.toBeInTheDocument()
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
      expect(screen.getByText(/swipe preview:/i)).toBeInTheDocument()

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
      expect(screen.queryByText(/swipe preview:/i)).not.toBeInTheDocument()
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
      expect(screen.queryByText(/swipe preview:/i)).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
