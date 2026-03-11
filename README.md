# Rubik's Cube Trainer

A keyboard-first Rubik's Cube trainer with direct touch gestures:

- 3D cube rendering with responsive stage sizing
- Scramble / reset controls
- Keyboard and button controls for rows, columns, and cube orientation
- Touch gestures for mobile play:
  - orbit-by-default drag to inspect the cube from any angle
  - press-and-hold visible sticker targeting for row/column turns
- Live gesture feedback and optional haptic arm confirmation

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

- Drag on the cube area to orbit the view (`viewYaw` / `viewPitch`).
- Press and hold a visible sticker until slice mode arms. If supported and enabled, the device pulses once when arming succeeds.
- After slice mode arms, drag along the touched face's local horizontal axis to turn rows:
  - top => `U/U'`
  - middle => `E/E'`
  - bottom => `D/D'`
- After slice mode arms, drag along the touched face's local vertical axis to turn columns:
  - left => `L/L'`
  - middle => `M/M'`
  - right => `R/R'`
- Release before the commit distance to cancel without mutating cube state.
- On narrow screens, `Session` and `Quick Touch Guide` stay above a collapsed `Secondary Controls` section so the cube interaction surface stays primary.
- Touch settings still expose:
  - gesture sensitivity (`low`, `medium`, `high`) for orbit-start slop and turn commit distance
  - haptic arm confirmation toggle (when browser/device supports vibration)

## Supported Interactions Matrix

| Interaction | Desktop keyboard | Desktop mouse | Mobile touch |
| --- | --- | --- | --- |
| Scramble / reset | Yes | Yes | Yes |
| Cube orientation | Yes (`Arrow`) | Yes (drag to orbit) | Yes (drag to orbit) |
| Row moves | Yes (`Q/W`, `A/S`, `Z/X`) | Yes (hold visible sticker, then horizontal face-local drag) | Yes (hold visible sticker, then horizontal face-local drag) |
| Column moves | Yes (`U/J`, `I/K`, `O/L`) | Yes (hold visible sticker, then vertical face-local drag) | Yes (hold visible sticker, then vertical face-local drag) |

## Validation Artifacts

- Visual QA checklist: `docs/visual-qa-checklist.md`
- Release/regression checklist: `docs/release-regression-checklist.md`
- Orientation semantics spec: `docs/orientation-turn-semantics.md`
- Vercel deployment runbook: `docs/deployment-vercel.md`
- Deployment validation handoff: `docs/deployment-handoff.md`

## Known Limitations

- Gesture engine is single-pointer only (multi-touch is ignored in v1).
- There is no dedicated recenter button; reframe the cube with free orbit drag or the existing arrow-key cube turns.
- Gesture sensitivity only adjusts orbit-start slop and slice commit distance. Hold timing stays fixed at `180 ms`.
- Haptic feedback depends on browser/device vibration support.
