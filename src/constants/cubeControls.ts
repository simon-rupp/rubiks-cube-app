import type {
  ColumnControl,
  DirectionButton,
  Face,
  RowControl,
  Shortcut,
} from '../types/cube'

export const FACE_ORDER: Face[] = ['U', 'R', 'F', 'D', 'L', 'B']

export const STICKER_COLORS: Record<string, string> = {
  U: '#f8fafc',
  R: '#ef4444',
  F: '#16a34a',
  D: '#facc15',
  L: '#f97316',
  B: '#2563eb',
}

export const ORIENTATION_CONTROLS: DirectionButton[] = [
  { label: 'Turn Left', keyHint: 'Arrow Left', move: "y'" },
  { label: 'Turn Right', keyHint: 'Arrow Right', move: 'y' },
  { label: 'Turn Up', keyHint: 'Arrow Up', move: 'x' },
  { label: 'Turn Down', keyHint: 'Arrow Down', move: "x'" },
]

export const ROW_CONTROLS: RowControl[] = [
  {
    row: 'Top row',
    left: { label: 'Left', keyHint: 'Q', move: "U'" },
    right: { label: 'Right', keyHint: 'W', move: 'U' },
  },
  {
    row: 'Middle row',
    left: { label: 'Left', keyHint: 'A', move: 'E' },
    right: { label: 'Right', keyHint: 'S', move: "E'" },
  },
  {
    row: 'Bottom row',
    left: { label: 'Left', keyHint: 'Z', move: 'D' },
    right: { label: 'Right', keyHint: 'X', move: "D'" },
  },
]

export const COLUMN_CONTROLS: ColumnControl[] = [
  {
    column: 'Left column',
    up: { label: 'Up', keyHint: 'U', move: 'L' },
    down: { label: 'Down', keyHint: 'J', move: "L'" },
  },
  {
    column: 'Middle column',
    up: { label: 'Up', keyHint: 'I', move: "M'" },
    down: { label: 'Down', keyHint: 'K', move: 'M' },
  },
  {
    column: 'Right column',
    up: { label: 'Up', keyHint: 'O', move: "R'" },
    down: { label: 'Down', keyHint: 'L', move: 'R' },
  },
]

export const SHORTCUTS: Record<string, Shortcut> = {
  ArrowLeft: { type: 'move', label: 'Turn Left', move: "y'" },
  ArrowRight: { type: 'move', label: 'Turn Right', move: 'y' },
  ArrowUp: { type: 'move', label: 'Turn Up', move: 'x' },
  ArrowDown: { type: 'move', label: 'Turn Down', move: "x'" },
  q: { type: 'move', label: 'Top row left', move: "U'" },
  w: { type: 'move', label: 'Top row right', move: 'U' },
  a: { type: 'move', label: 'Middle row left', move: 'E' },
  s: { type: 'move', label: 'Middle row right', move: "E'" },
  z: { type: 'move', label: 'Bottom row left', move: 'D' },
  x: { type: 'move', label: 'Bottom row right', move: "D'" },
  u: { type: 'move', label: 'Left column up', move: 'L' },
  j: { type: 'move', label: 'Left column down', move: "L'" },
  i: { type: 'move', label: 'Middle column up', move: "M'" },
  k: { type: 'move', label: 'Middle column down', move: 'M' },
  o: { type: 'move', label: 'Right column up', move: "R'" },
  l: { type: 'move', label: 'Right column down', move: 'R' },
  ' ': { type: 'scramble' },
  Space: { type: 'scramble' },
  Spacebar: { type: 'scramble' },
  r: { type: 'reset' },
}
