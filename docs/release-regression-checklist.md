# Release Regression Checklist

Use this checklist before pushing a release-oriented change.

## 1. Environment and dependency sanity

- [ ] `nvm use` (Node `20.19.0` baseline from `.nvmrc`)
- [ ] `npm install` completes without errors
- [ ] no unexpected local config files are staged

## 2. Automated quality gates

- [ ] `npm run test` passes
- [ ] `npm run check` passes (`typecheck + lint + build`)

## 3. Core functional checks

- [ ] `Scramble` updates cube and last-action status
- [ ] `Reset` restores solved state
- [ ] keyboard orientation works (`ArrowLeft/Right/Up/Down`)
- [ ] keyboard rows work (`Q/W`, `A/S`, `Z/X`)
- [ ] keyboard columns work (`U/J`, `I/K`, `O/L`)
- [ ] drag on the cube orbits the view without requiring a diagonal-only gesture
- [ ] press-and-hold on a visible sticker arms slice mode before any move can commit
- [ ] armed horizontal face-local drag triggers the expected row move
- [ ] armed vertical face-local drag triggers the expected column move
- [ ] release-before-commit cancels the armed slice and leaves cube state unchanged
- [ ] haptics toggle only affects the optional arm pulse and does not break unsupported browsers

## 4. Visual and responsive checks

- [ ] run [visual-qa-checklist.md](./visual-qa-checklist.md)
- [ ] verify mobile `Secondary Controls` behavior in both closed and open states
- [ ] verify no clipping/seam regressions in cube stage
- [ ] verify cube/session/quick-guide content stays above dense fallback controls on narrow screens
- [ ] verify controls remain usable at mobile, tablet, and desktop widths

## 5. Documentation and tracking

- [ ] `README.md`, `visual-qa-checklist.md`, and this checklist describe the orbit-default plus hold-to-slice contract
- [ ] relevant `br` issues moved to `in_progress` then `closed`
- [ ] close reason includes concrete completion summary

## 6. Git hygiene and push

- [ ] stage only intentional files
- [ ] commit in logical groups with clear intent
- [ ] `git pull --rebase`
- [ ] `git push origin main`
- [ ] mirror main to master: `git push origin main:master`
- [ ] `git status` shows clean tracked files
