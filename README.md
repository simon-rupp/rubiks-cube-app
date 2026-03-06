# Rubik's Cube Trainer

A simple, intuitive Rubik's Cube web app focused on easy controls first:

- Visual cube state (3D cube view)
- `Scramble` and `Reset`
- Turn whole cube: left, right, up, down
- Move rows: left/right (top/middle/bottom)
- Move columns: up/down (left/middle/right)
- Keyboard shortcuts for all controls

Built with React + TypeScript + Vite and `cubejs` for reliable cube state logic.

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

## Quality Check and M1 Parity

- Run `npm run check` for `typecheck + lint + build`.
- M1 refactor preserved the same control behavior:
1. `Scramble` and `Reset` buttons still trigger the same cube actions.
2. Arrow keys still rotate cube orientation.
3. `Q/W`, `A/S`, `Z/X` still control row moves.
4. `U/J`, `I/K`, `O/L` still control column moves.
5. `Space` still scrambles and `R` still resets.

## UX Layout Strategy

This MVP uses a two-panel layout for clarity and speed:

- Left/Center: large cube view
- Right: grouped controls in this order
1. Session actions (`Scramble`, `Reset`)
2. Cube orientation (`Turn Left/Right/Up/Down`)
3. Row controls (`Top/Middle/Bottom`)
4. Column controls (`Left/Middle/Right`)

Why this works:

- Most common actions are at the top.
- Directional tasks are grouped by mental model: first orient the cube, then move slices.
- Every button includes both plain-language direction and move notation.
- Buttons are touch-size friendly (44px minimum), so mobile users can already use the MVP.

## Keyboard Mapping

- `Space`: scramble
- `R`: reset
- `Arrow keys`: turn cube
- Rows:
1. `Q` / `W` top left/right
2. `A` / `S` middle left/right
3. `Z` / `X` bottom left/right
- Columns:
1. `U` / `J` left up/down
2. `I` / `K` middle up/down
3. `O` / `L` right up/down

## Phase Plan

### Phase 1 (Current)

- Working button + keyboard controls
- Scramble/reset
- Responsive desktop/mobile layout
- 3D cube render (all 6 faces)

### Phase 2 (Next)

- Add direct touch gestures:
1. Swipe on cube rows left/right
2. Swipe on cube columns up/down
3. Drag to rotate cube orientation
- Add optional move history and undo

### Phase 3 (Optional)

- Timed mode
- Beginner algorithm trainer
- Solver integration
