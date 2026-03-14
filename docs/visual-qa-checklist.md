# Visual QA Checklist

## Scope

Validate cube rendering and layout integrity at target breakpoints:

- 320
- 375
- 390
- 430
- 768
- 1024
- 1280
- 1440

## Test setup

- Date: 2026-03-13
- App URL: `http://127.0.0.1:4173` (`npm run preview`)
- Capture tool: `npx playwright screenshot --browser chromium`
- Viewport set: `320x568`, `375x667`, `390x844`, `430x932`, `768x1024`, `1024x768`, `1280x800`, `1440x900`
- Capture wait: `--full-page --wait-for-timeout 1200`
- Extra mobile pass: `Secondary Controls` checked in both closed and open states at `320x568`, `375x667`, `390x844`, and `430x932`
- Extra laptop containment pass: at `1024x768`, `1280x800`, and `1440x900`, keep `Secondary Controls` expanded and verify the header block, inner section cards, layer rows, button content, select, and checkbox all stay inside the outer card with no spillover or clipped edges

Note: this sweep used the repo baseline runtime on Node `20.19.0` after rebuilding the current tree with `npm run build`.

## Results

| Viewport | Result | Notes |
| --- | --- | --- |
| 320x568 | Pass | Cube, last-action, session, and quick-touch guidance stay above the collapsed fallback controls; open-state disclosure also stacks without clipping. |
| 375x667 | Pass | Mobile portrait spacing stays stable with the fallback disclosure both closed and open. |
| 390x844 | Pass | Cube stage, status blocks, and disclosure flow remain readable with no overlap in either mobile state. |
| 430x932 | Pass | Primary mobile flow stays intact and the opened fallback sections remain tappable without crowding. |
| 768x1024 | Pass | Tablet portrait layout stays balanced and keeps expanded fallback controls readable. |
| 1024x768 | Pass | Laptop split layout keeps the `Secondary Controls` header, each inner section card, the row and column button rows, and the touch settings controls contained within the outer card bounds. |
| 1280x800 | Pass | Mid-width laptop layout keeps the expanded `Secondary Controls` stack contained without card spillover, clipped edges, or button-row overflow. |
| 1440x900 | Pass | Wide laptop layout remains centered and keeps the full expanded `Secondary Controls` stack contained with no seam, clipping, or panel-spacing regressions. |

## Defects found

- None observed in this sweep.

## Retest trigger

Re-run this checklist after any change to:

- `src/App.tsx`
- `src/App.css`
- `src/components/ControlsPanel.tsx`
- `src/components/CubeView.tsx`
- `src/hooks/useCubeGestures.ts`
- layout breakpoints or cube geometry variables
