# Deployment Validation and Handoff (`rubiks-37r.5`)

Validation timestamp (UTC): 2026-03-06T23:01:48Z

## Final Outcome

- GitHub repository visibility: PASS
- Vercel production deployment: PASS
- Public default URL: `https://rubiks-xi.vercel.app`
- Canonical deployment URL: `https://rubiks-oblyomgo3-simons-projects-298cf4fb.vercel.app`
- Deployment ID: `dpl_DHyMrLPBTDfLEXrsYsYrGyLGXTC5`
- Vercel project ID: `prj_R1zKf1BqNaxV6HmhkVoSCgQOKXAr`

## Dependency Check

Command run:

```bash
br --no-db dep tree rubiks-37r.5
```

Result:

```text
rubiks-37r.5: Run post-deploy validation and publication handoff
  ├── rubiks-37r: Make repository public and deploy production site on Vercel
```

## Publication Checks

### GitHub Repository Visibility

Command:

```bash
gh repo view simon-rupp/rubiks-cube-app --json nameWithOwner,isPrivate,url,visibility,defaultBranchRef \
  --jq '{nameWithOwner,isPrivate,url,visibility,defaultBranch: .defaultBranchRef.name}'
```

Result:

```json
{"defaultBranch":"main","isPrivate":false,"nameWithOwner":"simon-rupp/rubiks-cube-app","url":"https://github.com/simon-rupp/rubiks-cube-app","visibility":"PUBLIC"}
```

Status: PASS

### Vercel Production Deployment

Command:

```bash
vercel inspect rubiks-xi.vercel.app
```

Key result:

```text
id      dpl_DHyMrLPBTDfLEXrsYsYrGyLGXTC5
target  production
status  Ready
url     https://rubiks-oblyomgo3-simons-projects-298cf4fb.vercel.app
alias   https://rubiks-xi.vercel.app
```

Status: PASS

### Live URL Response and Artifact Parity

Command:

```bash
curl -sL https://rubiks-xi.vercel.app | sed -n '1,120p'
```

Response excerpt:

```html
<title>rubiks-cube-app</title>
<script type="module" crossorigin src="/assets/index-D_p4uTXI.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-dWbGPovj.css">
```

Local production build (`npm run check`) generated the same asset filenames:

```text
dist/assets/index-dWbGPovj.css
dist/assets/index-D_p4uTXI.js
```

Status: PASS

### Local Quality Gates

Command:

```bash
npm run check
```

Result: PASS (`typecheck`, `lint`, and `build` all succeeded).

## Validation Scope and Limits

- Production publication is confirmed from GitHub and Vercel directly.
- Live HTML response and asset names match the current local production build, which materially strengthens deployment provenance.
- No headless browser was available in this shell, so post-deploy interaction checks were limited to deployment readiness, HTTP response, and artifact parity rather than live click-through testing.
- Existing automated smoke/unit coverage in this repo remains the behavioral validation source for keyboard, button, and gesture flows.

## Handoff Summary

- Repository: `https://github.com/simon-rupp/rubiks-cube-app`
- Production alias: `https://rubiks-xi.vercel.app`
- Canonical deployment URL: `https://rubiks-oblyomgo3-simons-projects-298cf4fb.vercel.app`
- Default URL strategy: Vercel-managed `vercel.app` alias only; no custom domain configured.
- Vercel project is linked to the public GitHub repository, so future `main` updates can deploy through Vercel integration.
