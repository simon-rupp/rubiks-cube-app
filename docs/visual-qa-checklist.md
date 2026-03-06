# Visual QA Checklist

## Scope

Validate cube rendering and layout integrity at target breakpoints:

- 320
- 375
- 390
- 430
- 768
- 1024
- 1440

## Test setup

- Date: 2026-03-06
- App URL: `http://127.0.0.1:4173` (`npm run preview`)
- Capture tool: `npx playwright screenshot --browser chromium`
- Viewport set: `320x568`, `375x667`, `390x844`, `430x932`, `768x1024`, `1024x768`, `1440x900`
- Capture wait: `--wait-for-selector .cube-stage --wait-for-timeout 600`

Note: local environment is on Node `18.20.8`; Vite emits a Node-version warning but preview/build still complete and render correctly.

## Results

| Viewport | Result | Notes |
| --- | --- | --- |
| 320x568 | Pass | Cube fully visible in stage, no edge clipping, no layout overlap. |
| 375x667 | Pass | Cube centered; controls stack correctly below fold as expected. |
| 390x844 | Pass | Mobile portrait spacing stable; no visible z-fighting artifacts. |
| 430x932 | Pass | Status/hint text remain readable; touch controls stay aligned. |
| 768x1024 | Pass | Tablet portrait two-panel transition remains clean and balanced. |
| 1024x768 | Pass | Desktop split layout stable; cube panel and controls panel align correctly. |
| 1440x900 | Pass | Wide desktop layout remains centered with no seam/clipping regressions. |

## Defects found

- None observed in this sweep.

## Retest trigger

Re-run this checklist after any change to:

- `src/App.css`
- `src/components/CubeView.tsx`
- `src/hooks/useCubeGestures.ts`
- layout breakpoints or cube geometry variables
