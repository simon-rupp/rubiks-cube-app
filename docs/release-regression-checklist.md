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
- [ ] drag diagonal rotates cube view (yaw/pitch changes)
- [ ] horizontal swipe triggers row moves
- [ ] vertical swipe triggers column moves
- [ ] haptics toggle does not break interactions when unsupported

## 4. Visual and responsive checks

- [ ] run [visual-qa-checklist.md](./visual-qa-checklist.md)
- [ ] verify no clipping/seam regressions in cube stage
- [ ] verify controls remain usable at mobile and desktop widths

## 5. Documentation and tracking

- [ ] `README.md` reflects current controls and quality commands
- [ ] relevant `br` issues moved to `in_progress` then `closed`
- [ ] close reason includes concrete completion summary

## 6. Git hygiene and push

- [ ] stage only intentional files
- [ ] commit in logical groups with clear intent
- [ ] `git pull --rebase`
- [ ] `git push origin main`
- [ ] mirror main to master: `git push origin main:master`
- [ ] `git status` shows clean tracked files
