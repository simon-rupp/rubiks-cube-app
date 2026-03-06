export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B'

export type DirectionButton = {
  label: string
  keyHint: string
  move: string
}

export type RowControl = {
  row: string
  left: DirectionButton
  right: DirectionButton
}

export type ColumnControl = {
  column: string
  up: DirectionButton
  down: DirectionButton
}

export type Shortcut =
  | { type: 'move'; label: string; move: string }
  | { type: 'scramble' }
  | { type: 'reset' }

export type MoveHandler = (move: string, label: string) => void
