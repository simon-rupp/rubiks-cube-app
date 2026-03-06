# Orientation Turn Semantics Spec (`rubiks-ou4.1`)

## Problem

User feedback reports that left/right cube turning currently feels inverted.

## Canonical Direction Semantics

Define direction from the viewer's perspective of rotating the whole cube in place:

- **Turn Left**: rotate cube left, bringing the cube's previous **right** side to the front.
- **Turn Right**: rotate cube right, bringing the cube's previous **left** side to the front.

## Required Control Mapping

These controls must remain equivalent:

- `Turn Left` button and `ArrowLeft`
- `Turn Right` button and `ArrowRight`

Expected cube notation mapping:

- `Turn Left` / `ArrowLeft` => `y`
- `Turn Right` / `ArrowRight` => `y'`

## Observable Outcomes (Solved Cube Baseline)

Start from solved orientation (`F` face in front):

- After **Turn Left** (`y`), front face center should be `R`.
- After **Turn Right** (`y'`), front face center should be `L`.

This baseline is the source of truth for regression tests.

## Middle-Column Up/Down Semantics (`rubiks-ou4.5`, superseded by `rubiks-2lb`)

Direction convention for the middle column must match left/right column behavior:

- **Middle column Up** means the front middle sticker path moves toward `U`.
- **Middle column Down** means the front middle sticker path moves toward `D`.

Required control mapping:

- `Middle column Up` button and `I` => `M'`
- `Middle column Down` button and `K` => `M`

Solved-cube observable outcomes:

- After **Middle column Up** (`M'`):
  - `U` center becomes `F`
  - `F` center becomes `D`
- After **Middle column Down** (`M`):
  - `D` center becomes `F`
  - `F` center becomes `U`

## Row/Column Direction Semantics (`rubiks-2lb.2`)

User feedback: row/column movement directions were reversed from expected behavior.

### Canonical Mapping

Rows:

- `Top row Left` / `Q` => `U`
- `Top row Right` / `W` => `U'`
- `Middle row Left` / `A` => `E'`
- `Middle row Right` / `S` => `E`
- `Bottom row Left` / `Z` => `D'`
- `Bottom row Right` / `X` => `D`

Columns:

- `Left column Up` / `U` => `L'`
- `Left column Down` / `J` => `L`
- `Middle column Up` / `I` => `M'`
- `Middle column Down` / `K` => `M`
- `Right column Up` / `O` => `R`
- `Right column Down` / `L` => `R'`

Swipe equivalence:

- Horizontal right swipe on a row must match that row's `Right` mapping.
- Horizontal left swipe on a row must match that row's `Left` mapping.
- Vertical up swipe on a column must match that column's `Up` mapping.
- Vertical down swipe on a column must match that column's `Down` mapping.

## Scope Notes

- This spec defines left/right orientation and middle-column up/down semantics.
- Up/down orientation semantics (`x` / `x'`) are unchanged.
- Gesture-based free rotation behavior is unchanged.
