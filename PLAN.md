# Rubik's Cube App: Next-Level Plan

## Project Understanding (Current State)
- Stack: React 19 + TypeScript + Vite + `cubejs`.
- Core app logic, keyboard mapping, and controls are all in `src/App.tsx`.
- Cube rendering is a CSS 3D composition of 6 faces in `src/App.css` (not individual cubies).
- Current interaction model is button + keyboard first; touch support is only larger button targets.
- There is no automated test suite yet for interaction correctness.
- Current quality constraints discovered during audit:
1. `npm run lint` fails on a React refs rule in `src/App.tsx`.
2. Toolchain expects Node 20.19+ (Vite 7), so environment consistency should be enforced for stable dev/prod parity.

## Outcomes We Want
1. Eliminate visible cube rendering defects (edge clipping, seams, z-fighting style artifacts).
2. Add direct touch interactions so mobile users can play naturally:
- Drag to rotate cube view.
- Swipe on cube rows/columns to execute moves.
3. Keep current keyboard/button controls as accessible fallback.
4. Ship with measurable quality gates (responsive behavior, gesture accuracy, no regressions).

## Milestone Plan

### Milestone 1: Foundation Hardening (1 day)
Goal: Prepare the codebase so visual and gesture work can be implemented safely.

Scope:
- Refactor `App.tsx` into focused units.
- Fix lint failure and establish a stable quality baseline.
- Add lightweight architecture for reusable move execution.

Tasks:
1. Extract cube state/actions into `src/hooks/useCubeState.ts` (`runMove`, `scramble`, `reset`, `facelets`, `lastAction`).
2. Extract presentational parts:
- `src/components/CubeView.tsx`
- `src/components/ControlsPanel.tsx`
3. Fix ref-in-render lint issue by removing render-time `cubeRef.current` access from state initialization.
4. Add a single `npm run check` script for typecheck + lint + build.
5. Add `.nvmrc` (or equivalent) documenting required Node version.

Exit criteria:
- `npm run lint` passes.
- `npm run build` passes on required Node version.
- Cube behavior matches current controls exactly.

### Milestone 2: Visual Rendering Fixes (1-2 days)
Goal: Resolve clipping/seam issues and make cube rendering visually robust across screen sizes.

Scope:
- Normalize 3D geometry math and staging.
- Remove depth inconsistencies that cause edge artifacts.
- Improve responsive scaling of the cube viewport.

Tasks:
1. Introduce explicit geometry variables in `App.css`:
- `--cube-size`, `--cube-half`, `--face-depth`, `--face-epsilon`.
2. Apply consistent `translateZ` depth logic for all faces (avoid mixed `+1px`, `+0.5px`, and raw half-depth values).
3. Add anti-artifact safeguards:
- Unified `backface-visibility` handling.
- Slight epsilon offset strategy to reduce z-fighting.
- Consistent face border/shadow treatment to hide seams cleanly.
4. Improve stage sizing logic:
- Replace hardcoded heights with `clamp()`-based responsive sizing.
- Ensure no clipping at 320px+ widths and common mobile heights.
5. Add manual visual QA checklist for breakpoints: 320, 375, 390, 430, 768, 1024, 1440.

Exit criteria:
- No visible edge clipping in tested breakpoints.
- Cube remains centered and fully visible on portrait mobile.
- Orientation and move readability are improved, not degraded.

### Milestone 3: Gesture Input Engine (2 days)
Goal: Introduce a robust pointer/touch state machine before wiring cube moves.

Scope:
- Build generic pointer gesture infrastructure on top of the cube viewport.
- Distinguish between view rotation drag vs move swipe reliably.

Tasks:
1. Add `useCubeGestures` hook with pointer-event state machine:
- `idle -> tracking -> rotateView` or `sliceSwipe`.
2. Implement axis locking and thresholds:
- Start threshold (8-12px).
- Lock horizontal vs vertical once dominant axis is clear.
3. Add interaction safety rules:
- Ignore multi-touch for v1.
- Cancel gesture on pointer cancel/loss.
- Use `touch-action: none` only on cube interaction surface.
4. Add view rotation state independent from cube logic moves:
- `viewYaw`, `viewPitch` with clamped pitch range.

Exit criteria:
- Dragging rotates view smoothly at ~60fps on modern mobile.
- Gesture detection is deterministic and does not conflict with page scroll outside cube area.

### Milestone 4: Swipe-to-Move for Mobile Play (2-3 days)
Goal: Let users perform row/column turns directly with swipes on cube.

Scope:
- Map swipe origin region + direction to existing move set.
- Keep behavior aligned with current button semantics.

Tasks:
1. Add hit-region mapping for the visible front grid:
- Determine row index (top/middle/bottom).
- Determine column index (left/middle/right).
2. Map gestures to move commands:
- Horizontal swipe -> row move (`U/E/D` with direction).
- Vertical swipe -> column move (`L/M/R` with direction).
3. Provide immediate interaction feedback:
- Active row/column highlight while swiping.
- Last move toast/status update reuse.
4. Add mobile UX refinements:
- Haptic feedback hook (when available).
- Optional gesture sensitivity setting in UI.
5. Keep keyboard/button controls intact as fallback and accessibility path.

Exit criteria:
- A mobile user can solve/scramble/reset using touch only.
- Swipe direction-to-move mapping is predictable after short onboarding.
- No accidental moves during simple view rotation.

### Milestone 5: Stabilization, Testing, and Polish (1-2 days)
Goal: Lock behavior and prevent regressions.

Scope:
- Add tests for move mapping correctness.
- Add documentation and release checklist.

Tasks:
1. Add unit tests for pure mapping logic:
- Swipe vector + region -> cube move.
- Orientation drag math bounds.
2. Add smoke tests for core flows:
- Scramble/reset.
- Keyboard controls.
- One touch rotation + one swipe move flow.
3. Update `README.md` with:
- Gesture controls.
- Supported interactions by desktop/mobile.
- Known limitations.
4. Add issue templates/checklist for future visual regressions.

Exit criteria:
- Core gesture logic covered by tests.
- README accurately reflects new interaction model.
- Release is reproducible and validated on desktop + mobile.

## Suggested Delivery Order
1. Milestone 1
2. Milestone 2
3. Milestone 3
4. Milestone 4
5. Milestone 5

## Risks and Mitigations
1. Risk: Gesture ambiguity between “rotate view” and “make move”.
Mitigation: strict threshold + axis lock + optional “gesture mode hint” overlay in early release.
2. Risk: CSS 3D artifacts vary by browser GPU.
Mitigation: test on Chrome Android + Safari iOS + desktop Chromium, and use conservative depth math.
3. Risk: Single-component architecture slows iteration.
Mitigation: complete Milestone 1 extraction before adding gesture complexity.

## Definition of Done for “Next Level”
1. Cube visuals are clean across target breakpoints with no clipping artifacts.
2. Mobile users can play with drag/swipe interactions without needing buttons.
3. Existing keyboard/button controls still work.
4. Lint/build are green and gesture logic has automated test coverage.
