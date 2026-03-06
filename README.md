# Rubik's Cube Trainer

A keyboard-first Rubik's Cube trainer with direct touch gestures:

- 3D cube rendering with responsive stage sizing
- Scramble / reset controls
- Keyboard and button controls for rows, columns, and cube orientation
- Touch gestures for mobile play:
  - diagonal drag to rotate view
  - row/column swipe to execute moves
- Live swipe preview and optional haptic feedback

Built with React + TypeScript + Vite and `cubejs`.

## Run

```bash
npm install
npm run dev
```

## Node Runtime

- Node.js `20.19+` (or `22.12+`) is required by Vite 7.
- `.nvmrc` pins the baseline runtime to `20.19.0`.

```bash
nvm use
```

## Quality Gates

- `npm run check` runs `typecheck + lint + build`.
- `npm run test` runs unit + smoke tests.

## Controls

### Keyboard

- `Space`: scramble
- `R`: reset
- `Arrow keys`: rotate cube orientation
- Rows:
  - `Q` / `W`: top row left/right
  - `A` / `S`: middle row left/right
  - `Z` / `X`: bottom row left/right
- Columns:
  - `U` / `J`: left column up/down
  - `I` / `K`: middle column up/down
  - `O` / `L`: right column up/down

### Touch / Pointer

- Drag diagonally on the cube area to rotate view (`viewYaw` / `viewPitch`).
- Swipe horizontally on the cube area to move rows:
  - top => `U/U'`
  - middle => `E/E'`
  - bottom => `D/D'`
- Swipe vertically on the cube area to move columns:
  - left => `L/L'`
  - middle => `M/M'`
  - right => `R/R'`
- Touch controls card includes:
  - gesture sensitivity (`low`, `medium`, `high`)
  - haptic feedback toggle (when browser/device supports vibration)

## Supported Interactions Matrix

| Interaction | Desktop keyboard | Desktop mouse | Mobile touch |
| --- | --- | --- | --- |
| Scramble / reset | Yes | Yes | Yes |
| Cube orientation | Yes (`Arrow`) | Yes (diagonal drag) | Yes (diagonal drag) |
| Row moves | Yes (`Q/W`, `A/S`, `Z/X`) | Yes (horizontal swipe) | Yes (horizontal swipe) |
| Column moves | Yes (`U/J`, `I/K`, `O/L`) | Yes (vertical swipe) | Yes (vertical swipe) |

## Validation Artifacts

- Visual QA checklist: `docs/visual-qa-checklist.md`
- Release/regression checklist: `docs/release-regression-checklist.md`
- Orientation semantics spec: `docs/orientation-turn-semantics.md`

## Known Limitations

- Gesture engine is single-pointer only (multi-touch is ignored in v1).
- Gesture mode split is axis-dominance based:
  - dominant horizontal/vertical => swipe move
  - near-diagonal => view rotation
- Haptic feedback depends on browser/device vibration support.
