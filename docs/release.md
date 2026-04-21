# CI/CD and Release Flow

## Quality Gate

The baseline quality gate is:

```bash
npm run ci
```

It runs:

1. TypeScript check (`npm run typecheck`)
2. Production build (`npm run build`)
3. Test command (`npm run test:ci`)

GitHub Actions workflow: `.github/workflows/ci.yml`

## Release Flow

GitHub Actions workflow: `.github/workflows/release.yml`

Release runs automatically when a tag matching `v*` is pushed.

Example:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release workflow re-runs `npm run ci` and then creates a GitHub Release with generated notes.

## Production Notes

- Protect `main` with required check: `CI / quality-gates`.
- Keep secrets in GitHub/Supabase secret stores only.
- Use staging validation before tagging production versions.
