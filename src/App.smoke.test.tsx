import { fireEvent, render, screen } from '@testing-library/react'
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

describe('App smoke flows', () => {
  it('handles scramble and reset from control buttons', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /scramble/i }))
    expect(getLastActionStatus()).toHaveTextContent('Scrambled')

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(getLastActionStatus()).toHaveTextContent('Reset to solved state')
  })

  it('applies keyboard controls for cube moves', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(getLastActionStatus()).toHaveTextContent("Turn Left (y')")

    fireEvent.keyDown(window, { key: 'r' })
    expect(getLastActionStatus()).toHaveTextContent('Reset to solved state')
  })

  it('supports drag rotation on diagonal gestures', () => {
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
      clientX: 144,
      clientY: 140,
      isPrimary: true,
    })
    fireEvent.pointerUp(interaction, {
      pointerId: 1,
      clientX: 144,
      clientY: 140,
      isPrimary: true,
    })

    const cube = interaction.querySelector('.cube-3d')
    expect(cube).not.toBeNull()
    expect(cube?.getAttribute('style')).toContain('--view-yaw')
    expect(cube?.getAttribute('style')).not.toContain('--view-yaw: -22deg')
  })

  it('supports swipe-to-move on the cube surface', () => {
    render(<App />)

    const interaction = screen.getByRole('img', { name: /interaction area/i })
    mockInteractionBounds(interaction)

    fireEvent.pointerDown(interaction, {
      pointerId: 2,
      clientX: 72,
      clientY: 70,
      button: 0,
      isPrimary: true,
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

    expect(getLastActionStatus()).toHaveTextContent('Top row right (U)')
  })
})
