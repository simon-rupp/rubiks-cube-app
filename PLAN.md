# Rubik's Cube Trainer: Mobile Interaction Revision Plan

## Problem Statement
The current pointer contract forces users to classify motion from the first few pixels:

- axis-dominant drag => row/column move
- near-diagonal drag => camera orbit

That contract is the main product problem on mobile and touch-enabled desktop devices because:

- users cannot freely drag the cube to inspect it from any angle
- accidental slice moves are too easy
- slice targeting assumes a fixed front-face 3x3 screen grid even after the cube has been rotated

## Desired End State
- Any single-pointer drag can orbit the cube view.
- A row or column move requires an intentional press-and-hold on a visible sticker, then a drag.
- Slice mode is visibly confirmed before a move can commit, with optional haptic confirmation when supported.
- Slice mapping is based on the touched visible face and that face's local axes, not a fixed screen grid.
- Mobile users can scramble, inspect, and solve with touch only.
- The mobile layout makes the cube surface and session actions primary; dense move grids become secondary on narrow screens.
- Docs, tests, and release checklists describe the same interaction model the code implements.

## Scope
- Replace the current diagonal-vs-straight gesture heuristic with an explicit orbit-vs-slice state machine.
- Add face-aware sticker targeting and move mapping.
- Update gesture feedback, hint copy, and safe-abort behavior.
- Rebalance narrow-screen layout so the cube interaction surface is first-class.
- Update tests, docs, and release checklists to match the new contract.

## Non-Goals
- Changing keyboard shortcuts, button labels, or cube move notation in `src/constants/cubeControls.ts`.
- Moving cube mutation out of `src/hooks/useCubeState.ts`.
- Replacing the CSS cube renderer with WebGL.
- Adding multi-touch gestures, pinch zoom, or full turn animation.
- Changing deployment configuration or Vercel behavior.

## Architectural Invariants
- `src/hooks/useCubeState.ts` remains the only state owner for cube mutations and `lastAction`.
- `src/constants/cubeControls.ts` remains the canonical source for button labels, keyboard shortcuts, and move notation.
- `src/hooks/useCubeGestures.logic.ts` becomes the canonical source for pointer-intent interpretation and face-aware swipe-to-move mapping.
- `src/components/CubeView.tsx` renders cube geometry, sticker hit targets, and gesture feedback only; it must not own move semantics.
- `src/components/ControlsPanel.tsx` renders controls and forwards actions only; it must not own gesture logic.
- `src/App.tsx` stays as composition/wiring, not a fallback home for gesture rules.

## Workstream Map
| Workstream | Primary files | Supporting files | Must stay aligned with |
| --- | --- | --- | --- |
| Gesture contract and thresholds | `src/hooks/useCubeGestures.ts`, `src/hooks/useCubeGestures.logic.ts` | `src/hooks/useCubeGestures.logic.test.ts` | `README.md`, this plan |
| Move semantics | `src/hooks/useCubeGestures.logic.ts` | `src/constants/cubeControls.ts`, `docs/orientation-turn-semantics.md` | keyboard/button semantics |
| Render targets and feedback | `src/components/CubeView.tsx` | `src/App.css`, `src/App.smoke.test.tsx` | gesture hook outputs |
| Layout and control hierarchy | `src/App.tsx`, `src/components/ControlsPanel.tsx`, `src/App.css` | `README.md`, visual QA docs | mobile-first priority |
| Verification and release docs | `README.md`, `docs/visual-qa-checklist.md`, `docs/release-regression-checklist.md` | tests above | shipped interaction contract |

## Decisions To Lock Early
These should be treated as explicit decision points during implementation, with the recommended default already chosen here unless new evidence forces a change.

1. Pointer-device scope
   Default: use one pointer contract for both touch and mouse so there is one gesture engine to test.
   Rationale: splitting behavior by device type will create duplicated logic and drift.

2. Sensitivity control behavior
   Default: keep `gestureSensitivity` only if it still maps cleanly to orbit slop and slice commit distance.
   Constraint: hold duration must not silently change with sensitivity.
   Fallback: if the control becomes confusing after the redesign, remove or hide it in the mobile layout phase rather than keeping misleading UI.

3. Slice confirmation feedback
   Default: visual confirmation is required; optional haptic feedback fires when slice mode becomes armed, not before.
   Constraint: no move may commit before slice mode is visibly armed.

4. Hit-target strategy
   Default: prefer sticker- or face-level metadata emitted by `CubeView` and pure mapping helpers in `useCubeGestures.logic.ts`.
   Fallback: only add heavier geometry math if DOM-level metadata cannot reliably identify the touched visible sticker.

5. Recenter control
   Default: treat "recenter view" as optional until the new orbit contract is implemented and tested.
   Gate: add it only if manual QA shows users regularly get lost after free orbit.

## Dependency Order
1. Lock the interaction contract and acceptance matrix.
2. Rebuild gesture state handling around that contract.
3. Add face-aware targeting and move mapping.
4. Layer feedback, haptics, and copy on top of the stable gesture outputs.
5. Rebalance layout once the interaction and copy are stable.
6. Finish docs, regression coverage, and release validation.

The plan below follows that order on purpose. Later bead generation should preserve these dependencies unless a phase is split into smaller pure-function or test-only tasks.

## Explicit Pointer State Contract
This section is the concrete deliverable for the first contract bead. It defines the allowed states and transition intent without locking the numeric thresholds yet.

| State | Entered when | Can transition to | Must be true in this state | Exit behavior |
| --- | --- | --- | --- | --- |
| `idle` | No active primary pointer is being tracked. | `orbitCandidate`, `slicePress` | No pending hold timer, no armed slice target, no active gesture feedback. | Any cancel or release path must return here cleanly. |
| `orbitCandidate` | Primary pointer goes down on the cube surface without starting a valid slice press target. This is also the fallback when a press misses a valid visible sticker. | `orbiting`, `idle` | The gesture is still eligible to become a normal view drag; it is not eligible to commit a move. | Release before orbit starts is a no-op; cancel returns to `idle`. |
| `orbiting` | Pointer movement crosses orbit-start conditions before slice mode is armed. | `idle` | Pointer movement updates `viewYaw` and `viewPitch`; no slice move may arm or commit mid-orbit. | Release or cancel ends orbit and returns to `idle` without executing a cube move. |
| `slicePress` | Primary pointer goes down on a valid visible sticker target and starts the hold-to-slice window. | `sliceArmed`, `orbiting`, `idle` | A hold timer is active, the initial sticker target is remembered, and drift is checked against slice-arm tolerance. No move preview is allowed to imply commitment yet. | If the pointer releases early, is cancelled, or drifts too far before arming, the state exits without a move. Drift fallback goes to `orbiting`; other exits return to `idle`. |
| `sliceArmed` | The hold-to-slice window completes on the same valid target without excessive drift. | `sliceDragging`, `idle` | The slice target is now confirmed. Required visual confirmation is shown here, and optional haptic feedback may fire here. | Release without sufficient drag is a safe abort to `idle` with no move committed. Cancel also returns to `idle`. |
| `sliceDragging` | The user drags after slice mode is armed and the drag is being interpreted against the armed face's local axes. | `idle` | Only the armed face, row/column target, and candidate move are active. Dragging may update preview state, but commit still waits for release and commit-distance validation. | Release above commit threshold executes exactly one move and returns to `idle`; release below threshold aborts with no move and returns to `idle`; cancel returns to `idle`. |

### Invalid-target rule
- Presses that do not start on a valid visible sticker target must never enter `slicePress`.
- Invalid-target presses fall back to `orbitCandidate`, so the user can still drag to inspect the cube.
- Invalid-target handling must never create a hidden slice state or a silent move on release.

### Cancellation rule
- `pointercancel`, lost pointer capture, or secondary-pointer interference always clear timers, previews, and active targets, then return to `idle`.
- Cancellation must be idempotent: repeated cancel or cleanup signals cannot leave stale state behind.

### Bead boundary note
- `rubiks-la6.1.1` owns the state names, transitions, and invalid-target or cancel exits.
- `rubiks-la6.1.2` owns the numeric thresholds and control-policy tuning for those transitions.
- `rubiks-la6.1.3` owns the doc and QA language that must be updated to match this contract.

## Threshold Defaults and Control Rules
This section is the concrete deliverable for `rubiks-la6.1.2`. These defaults are the implementation targets unless manual QA during later code beads proves a specific value is unworkable.

| Control | Low | Medium | High | Ownership rule |
| --- | --- | --- | --- | --- |
| Orbit start slop | `12px` | `8px` | `6px` | Sensitivity may scale this value. |
| Slice commit distance | `34px` | `26px` | `20px` | Sensitivity may scale this value. |
| Slice hold duration | `180ms` | `180ms` | `180ms` | Sensitivity must not change this value. |
| Slice-arm drift tolerance | `10px` | `10px` | `10px` | Sensitivity must not change this value. |
| Haptic pulse length | `12ms` | `12ms` | `12ms` | Sensitivity must not change this value. |

### Control-policy rules
- Touch and mouse use the same pointer contract. Keyboard and button controls remain the fast desktop fallback, but the pointer engine does not fork by device type.
- A press on a valid visible sticker enters `slicePress`. A press that misses a valid visible sticker falls back to `orbitCandidate`.
- Invalid-target presses may orbit or no-op on release, but they must never arm slice mode and must never commit a move.
- Drift beyond `10px` before the `180ms` hold completes cancels slice arming and hands the gesture to orbiting behavior.
- Slice commit is checked only on release from `sliceDragging`; crossing commit distance during drag may update preview state but must not execute early.
- Haptic feedback, when enabled and supported, fires once on the `slicePress -> sliceArmed` transition only.
- No haptic pulse fires for plain orbiting, invalid-target no-ops, aborted slice releases, or successful move commit unless a later bead explicitly changes the contract.
- Sensitivity profiles may change orbit-start slop and slice commit distance only. They must not change hold duration, drift tolerance, haptic timing, or invalid-target handling.
- Secondary-pointer interference, `pointercancel`, or lost pointer capture always aborts the active gesture with no move committed.

### Implementation intent
- `low` is the stable profile for users who want more travel before orbit start and slice commit.
- `medium` is the default profile and should feel closest to the current shipped gesture distance at commit time.
- `high` is the quick profile and reduces travel for both orbit start and slice commit without reducing the deliberate hold-to-slice gate.

## Invalidated Language and Acceptance Matrix
This section is the concrete deliverable for `rubiks-la6.1.3`. It identifies the repo language that becomes wrong under the new contract and defines the acceptance checks later implementation beads must satisfy.

### Language that is already stale once the new contract ships
| Surface | Current language or assumption | Why it becomes wrong | Later owner |
| --- | --- | --- | --- |
| `README.md` touch and pointer controls | Diagonal drag rotates view; horizontal or vertical swipe directly turns rows or columns. | Pointer movement is no longer angle-classified from the first pixels; hold-to-slice becomes the move gate. | Docs and final validation beads |
| `README.md` supported interactions matrix | Desktop mouse row and column moves happen by direct swipe. | Mouse follows the same pointer contract as touch in this plan, so direct swipe becomes orbit unless slice mode is armed. | Docs and final validation beads |
| `src/components/CubeView.tsx` gesture hint | "Drag diagonally to rotate view. Swipe straight across rows/columns to make a move." | Both halves of that sentence are invalid under orbit-by-default plus hold-to-slice. | Feedback and copy beads |
| `src/components/ControlsPanel.tsx` touch-controls copy | "Swipe rows/columns on the cube. Drag diagonally to rotate the view." | Same outdated heuristic; it also hides the hold requirement. | Feedback and copy beads |
| `docs/release-regression-checklist.md` core functional checks | Diagonal drag rotates; horizontal swipe triggers rows; vertical swipe triggers columns. | Release validation must check orbit-by-default, hold-to-arm, safe abort, and face-aware mapping instead. | Docs and final validation beads |
| `docs/orientation-turn-semantics.md` swipe equivalence and scope notes | Swipe equivalence is described as immediate row or column swipe behavior; scope note says free rotation behavior is unchanged. | The move contract changes, and the gesture behavior is no longer unchanged. Touch equivalence must be restated in terms of armed slice drag direction. | Gesture semantics docs bead |
| `src/App.smoke.test.tsx` gesture smoke tests | Diagonal drag is the orbit proof and direct swipe is the move proof. | Smoke coverage must prove horizontal or vertical orbit plus hold-to-slice behavior instead. | Test beads |
| `src/hooks/useCubeGestures.logic.test.ts` mapping assumptions | Fixed front-grid swipe assumptions remain implicit in current test coverage. | Face-aware mapping and armed-slice logic need a different pure-test contract. | Test beads |

### Acceptance matrix for later implementation beads
| Scenario | Required outcome | Primary surfaces that must agree |
| --- | --- | --- |
| Drag starts on non-sticker or invalid target | Gesture may orbit or no-op, but it never arms slice mode and never commits a move. | `useCubeGestures.ts`, `CubeView.tsx`, smoke tests |
| Drag starts on valid visible sticker but moves before hold completes | Slice arming is cancelled and the gesture becomes orbiting behavior. | `useCubeGestures.ts`, `useCubeGestures.logic.ts`, smoke tests |
| Hold completes on valid visible sticker | Slice mode becomes visibly armed before any move can commit; optional haptic may fire here. | `useCubeGestures.ts`, `CubeView.tsx`, `ControlsPanel.tsx` copy |
| Armed slice is released before commit distance | No move executes; preview and highlight state clear cleanly. | `useCubeGestures.ts`, `CubeView.tsx`, smoke tests |
| Armed slice is dragged past commit distance and released | Exactly one canonical move executes and `lastAction` matches the mapped label and move. | `useCubeState.ts`, `useCubeGestures.logic.ts`, smoke tests |
| Cube has been orbited before slice interaction | Move mapping follows the touched visible face and its local axes, not screen thirds tied to the original front face. | `useCubeGestures.logic.ts`, `CubeView.tsx`, unit tests |
| Keyboard and button controls are used after the gesture refactor | Existing labels, shortcuts, and move notation remain unchanged. | `cubeControls.ts`, `App.tsx`, README, smoke tests |
| Mobile layout on narrow screens | Cube, session actions, and short gesture guidance are available before dense desktop-style controls. | `App.tsx`, `ControlsPanel.tsx`, `App.css`, visual QA |
| Release validation | Automated checks pass and manual QA reflects the new hold-to-slice contract. | README, release checklist, visual QA checklist, tests |

### Handoff rule for implementation beads
- Any later bead that changes gesture behavior must update the matching row in this matrix or prove that the change does not affect the row.
- Any later bead that updates docs or copy must remove the stale wording listed above rather than layering new language beside it.

## Phase 1: Lock the Interaction Contract

### Why this phase exists
This change affects gesture semantics, copy, tests, and release docs. If the contract is not locked first, implementation will drift across `README.md`, `useCubeGestures`, `CubeView`, and the regression checklist.

### Must be true before it starts
- Existing keyboard/button semantics in `src/constants/cubeControls.ts` and `docs/orientation-turn-semantics.md` are treated as fixed baseline behavior.
- The product direction is accepted: drag to orbit, hold a visible sticker then drag to turn, mobile-first layout.

### Work in this phase
- Define the gesture state model explicitly, e.g. `idle -> orbitCandidate -> orbiting` and `idle -> slicePress -> sliceArmed -> sliceDragging`, including cancellation exits.
- Define named thresholds for hold duration, orbit slop, slice-arm drift tolerance, and move commit distance.
- Define what happens when the initial press does not land on a valid visible sticker target.
- Define whether desktop mouse uses the same contract as touch.
- Define which existing copy and docs become invalid the moment this contract ships.

### Produces
- One explicit interaction contract that implementation tasks can follow without inventing behavior.
- A concrete acceptance matrix for gesture behavior, move semantics, docs, and tests.
- No remaining ambiguity about when orbit begins, when slice mode arms, or when a move can commit.

### Verification
- Each gesture behavior in the contract can be restated as a testable rule.
- No later phase needs to decide new semantics on the fly.
- There is a clear mapping from contract rules to affected files and tests.

## Phase 2: Rebuild Gesture State Handling

### Why this phase exists
The current axis-dominance heuristic in `src/hooks/useCubeGestures.ts` is the root behavior problem. It must be replaced before face-aware mapping, UI feedback, or mobile layout changes can be trusted.

### Must be true before it starts
- Phase 1 has locked the state names and thresholds.
- `src/hooks/useCubeState.ts` remains unchanged as the only move executor.
- Any planned change to `gestureSensitivity` behavior is explicitly understood.

### Work in this phase
- Replace the current `tracking` / `rotateView` / `sliceSwipe` model with explicit press, arm, drag, orbit, and cancel states.
- Make orbit the default outcome for a normal drag that has not armed slice mode.
- Add a hold timer for slice arming and cancel slice arming if the pointer drifts too far before the hold completes.
- Preserve robust cleanup for `pointercancel`, lost pointer capture, release-before-commit, and extra-finger interference.
- Keep the hook API narrowly focused: view rotation state, armed-slice feedback, and commit requests routed through `onMove`.

### Produces
- A deterministic gesture state machine in `src/hooks/useCubeGestures.ts`.
- Pure helper logic in `src/hooks/useCubeGestures.logic.ts` that can be unit tested without DOM rendering.
- A design where no move can execute before slice mode is armed.

### Verification
- Unit tests cover hold timing, drift cancellation, orbit start, lost capture, release-before-commit, and single-pointer rules.
- Smoke coverage proves horizontal and vertical drags can orbit when slice mode is not armed.
- Existing regressions around accidental straight-line moves are no longer possible by design.

## Phase 3: Add Face-Aware Targeting and Move Mapping

### Why this phase exists
Hold-to-slice is only useful if the drag maps to the face the user is actually touching after the cube has been rotated. The current front-grid assumption must be retired.

### Must be true before it starts
- Phase 2 can represent an armed slice target separately from orbiting.
- The hit-target strategy is chosen: start with rendered sticker or face metadata before inventing heavier geometry math.
- `src/constants/cubeControls.ts` and `docs/orientation-turn-semantics.md` remain the semantic source of truth for move meaning.

### Work in this phase
- Expose enough sticker and face identity from `src/components/CubeView.tsx` for the hook layer to know what the user armed.
- Convert screen-space drag direction into the touched face's local horizontal and vertical axes.
- Map `face + sticker row/col + local axis + direction` to the existing move vocabulary (`U`, `E`, `D`, `L`, `M`, `R` and inverses).
- Keep move-mapping helpers pure and documented in `src/hooks/useCubeGestures.logic.ts`.
- Ensure the mapping does not duplicate or silently contradict keyboard/button semantics.

### Produces
- Face-aware targeting that follows the currently visible cube surface.
- A pure mapping layer that can be tested independently from rendering.
- A clear seam between render metadata (`CubeView`) and semantics (`useCubeGestures.logic.ts`).

### Verification
- Unit tests cover front, right, and up visible faces at minimum, plus inverse directions.
- Regression tests prove touch mappings still align with `src/constants/cubeControls.ts` and `docs/orientation-turn-semantics.md`.
- No code outside the gesture logic layer contains duplicated `face + drag -> move` rules.

## Phase 4: Add Feedback, Guidance, and Safe-Abort UX

### Why this phase exists
Hold-to-slice introduces deliberate friction on purpose. Without immediate feedback, the interaction will feel broken or arbitrary instead of intentional.

### Must be true before it starts
- Phase 2 exposes reliable orbit vs slice-armed states.
- Phase 3 exposes the armed sticker, row, and column information needed for rendering.
- The haptic confirmation decision has been locked.

### Work in this phase
- Replace the fixed front-grid swipe overlay in `src/components/CubeView.tsx` with feedback tied to the armed slice target.
- Highlight the touched sticker and the candidate row or column once slice mode is armed.
- Update copy in `src/components/CubeView.tsx` and `src/components/ControlsPanel.tsx` to the new contract.
- Ensure release-before-commit clears all feedback without mutating cube state.
- Re-evaluate whether a dedicated "recenter view" control is necessary based on observed QA friction.

### Produces
- Visual feedback that distinguishes orbiting, slice-armed, slice-dragging, and cancelled states.
- Copy that matches the real interaction model instead of the old diagonal-vs-straight heuristic.
- A safe abort path that users can trust.

### Verification
- Component or smoke coverage verifies the updated hint copy and at least one armed or abort feedback path.
- Manual QA confirms that aborting a slice does not execute a move or leave stale highlights.
- If haptics are enabled, unsupported browsers still behave correctly without errors.

## Phase 5: Rebalance Layout for Mobile

### Why this phase exists
The interaction model only becomes genuinely mobile-first if the cube surface and session actions appear first and remain usable at small widths.

### Must be true before it starts
- The core gesture contract and feedback copy are stable enough that layout work will not be immediately invalidated.
- Desktop keyboard and button controls remain supported as non-primary actions on large screens.

### Work in this phase
- Reorder narrow-screen layout in `src/App.tsx`, `src/components/ControlsPanel.tsx`, and `src/App.css` so the cube, session actions, and short gesture hint are above the dense move grids.
- Collapse, defer, or otherwise demote orientation, row, and column button groups on phone widths while keeping them available.
- Retune stage sizing and spacing for the existing visual QA breakpoints, especially 320-430 px widths.
- Decide whether sensitivity and haptics controls stay immediately visible on mobile or move behind an advanced section.

### Produces
- A narrow-screen layout where users can start interacting without scrolling through desktop-oriented controls.
- A clearer hierarchy between primary mobile actions and secondary desktop support controls.
- CSS and component structure that still hold up at tablet and desktop widths.

### Verification
- Re-run the visual QA checklist at 320, 375, 390, 430, 768, 1024, and 1440 widths.
- Manual checks confirm the cube is fully visible, controls remain tappable, and no layout overlap or clipping is introduced.
- Desktop layout still preserves access to keyboard-equivalent controls.

## Phase 6: Finish Docs, Regression Coverage, and Release Validation

### Why this phase exists
This work changes the shipped control contract. README, smoke tests, and release checklists must be updated in the same pass or the next change will reintroduce ambiguity.

### Must be true before it starts
- Phases 2-5 are functionally complete.
- Any scope decisions about sensitivity, haptics, and recenter control are final.

### Work in this phase
- Update `README.md` so keyboard, pointer, and mobile behavior match the implementation.
- Update `docs/release-regression-checklist.md` to reflect the new expected gesture behavior.
- Update `docs/visual-qa-checklist.md` if the layout, breakpoints, or capture expectations change.
- Update `src/hooks/useCubeGestures.logic.test.ts` and `src/App.smoke.test.tsx` to cover the new contract.
- Re-run all required automated and manual checks.

### Produces
- Aligned docs, automated coverage, and release checklists.
- A release-ready change set with explicit evidence that gesture semantics, layout, and copy all agree.
- No stale references to diagonal-only rotation or fixed front-grid swipe targeting.

### Verification
- `npm run test`
- `npm run check`
- Manual QA on iPhone Safari, Chrome on Android, and desktop Chromium touch emulation.
- Visual QA checklist completed at the documented breakpoints.
- Release checklist completed with no stale interaction language.

## Test and QA Expectations

### Automated coverage required
- Pure logic tests for hold timing, slop and drift cancellation, face-aware mapping, inverse directions, and non-commit aborts.
- Smoke or integration coverage for:
  - scramble and reset still working
  - keyboard controls still matching `src/constants/cubeControls.ts`
  - orbiting on horizontal and vertical drags
  - hold-then-drag row move
  - hold-then-drag column move
  - hold-then-release with no move committed

### Manual interaction matrix required
- iPhone Safari on physical hardware if available
- Chrome on Android on physical hardware if available
- Desktop Chromium touch emulation
- Desktop mouse interaction, because the recommended plan keeps one pointer contract

### Visual QA required
- Reuse the current documented breakpoints: 320, 375, 390, 430, 768, 1024, 1440.
- Re-run after any changes to `src/App.css`, `src/components/CubeView.tsx`, `src/hooks/useCubeGestures.ts`, or cube geometry variables.

### Release-readiness gate
A release-oriented implementation is not done until all of the following are true:

- `npm run test` passes
- `npm run check` passes
- README and regression docs describe the shipped interaction model
- visual QA and manual pointer QA have been rerun
- no stale copy remains in `CubeView`, `ControlsPanel`, or docs

## Risks and Mitigations
- Risk: hold-to-turn adds friction for expert users.
  Mitigation: keep keyboard and buttons as fast paths, keep hold duration short, and make armed feedback immediate and clear.
- Risk: face-aware targeting is more complex than the current fixed-grid model.
  Mitigation: keep targeting and mapping in pure helpers with tests before wiring them into the rendered cube.
- Risk: touch and keyboard or button semantics drift apart.
  Mitigation: treat `src/constants/cubeControls.ts` and `docs/orientation-turn-semantics.md` as invariants and test touch equivalence directly against them.
- Risk: the current sensitivity control no longer maps cleanly to the new contract.
  Mitigation: decide early whether it stays, changes meaning, or is hidden or removed for mobile.
- Risk: layout work regresses the currently documented responsive breakpoints.
  Mitigation: re-run the existing visual QA checklist and keep layout changes constrained to the current app shell and control surfaces.

## Natural Task Boundaries for Later `br` Beads
These are implementation slices, not beads created yet.

1. Contract and threshold lock-in, including explicit acceptance criteria.
2. Gesture state machine rewrite plus pure logic tests.
3. Face or sticker target metadata and face-aware move mapping.
4. Feedback, hint copy, haptics behavior, and abort handling.
5. Mobile layout and control hierarchy changes.
6. Docs, smoke coverage, visual QA, release checklist, and final verification.

Default dependency chain:

- 1 -> 2 -> 3 -> 4 -> 5 -> 6
- Phase 5 should not start until the core interaction copy is stable enough to avoid immediate rewrite.
- Phase 6 depends on the actual shipped behavior from phases 2-5, not on intent alone.
