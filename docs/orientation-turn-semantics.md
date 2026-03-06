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

## Middle-Column Up/Down Semantics (`rubiks-ou4.5`)

Direction convention for the middle column must match left/right column behavior:

- **Middle column Up** means the front middle sticker path moves toward `U`.
- **Middle column Down** means the front middle sticker path moves toward `D`.

Required control mapping:

- `Middle column Up` button and `I` => `M`
- `Middle column Down` button and `K` => `M'`

Solved-cube observable outcomes:

- After **Middle column Up** (`M`):
  - `D` center becomes `F`
  - `F` center becomes `U`
- After **Middle column Down** (`M'`):
  - `U` center becomes `F`
  - `F` center becomes `D`

## Scope Notes

- This spec defines left/right orientation and middle-column up/down semantics.
- Up/down orientation semantics (`x` / `x'`) are unchanged.
- Gesture-based free rotation behavior is unchanged.
