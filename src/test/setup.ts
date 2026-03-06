import '@testing-library/jest-dom/vitest'

class MockPointerEvent extends MouseEvent {
  pointerId: number
  pointerType: string
  isPrimary: boolean

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params)
    this.pointerId = params.pointerId ?? 1
    this.pointerType = params.pointerType ?? 'mouse'
    this.isPrimary = params.isPrimary ?? true
  }
}

if (!window.PointerEvent) {
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    writable: true,
    value: MockPointerEvent,
  })
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {}
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {}
}
