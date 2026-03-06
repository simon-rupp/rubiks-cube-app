# Vercel Deployment Pipeline and Hosting Integration

This document defines the deployment configuration for `rubiks-37r.3`.

Current linked project state (captured 2026-03-06):

- Team: `simons-projects-298cf4fb` (`Simon's projects`)
- Project name: `rubiks`
- Project ID: `prj_R1zKf1BqNaxV6HmhkVoSCgQOKXAr`
- Production alias: `https://rubiks-xi.vercel.app`
- Canonical deployment URL: `https://rubiks-oblyomgo3-simons-projects-298cf4fb.vercel.app`

## Hosting Configuration

Project-level settings in Vercel are:

- Framework Preset: `Vite`
- Root Directory: `.`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`
- Production Branch: `main`
- Node.js Version: `24.x`

Repository-level config is committed in `vercel.json`.

Local runtime baseline remains `.nvmrc` = `20.19.0`. Vite 7 supports Node `20.19+`, so the current Vercel `24.x` setting is compatible.

## GitHub Integration

- Public repository: `https://github.com/simon-rupp/rubiks-cube-app`
- Vercel project is linked to the GitHub repository.
- Production branch is `main`.
- Use the Vercel default public URL (`vercel.app`); no custom domain is configured.

## CI/CD Pipeline (GitHub Actions)

Workflow file: `.github/workflows/vercel-deploy.yml`

Behavior:

- Pull requests to `main`: build and publish a Vercel Preview deployment.
- Pushes to `main`: build and publish a Vercel Production deployment.
- Manual trigger via `workflow_dispatch` is available.
- If required repo secrets are absent, the workflow exits cleanly without attempting a deploy.

## Required GitHub Secrets

Set these repository secrets for the workflow:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

These values are available from the Vercel project after linking.

## Local Fallback Commands

Manual production deployment command used for the first live release:

```bash
vercel deploy --prod --yes --scope simons-projects-298cf4fb --logs
```

If a prebuilt/manual deployment is needed:

```bash
npx vercel pull --yes --environment=production
npx vercel build
npx vercel deploy --prebuilt --prod
```
