# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

## Adding a changeset

When you make a change that should be released:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the semver bump type (major/minor/patch)
3. Write a summary of the changes

## Releasing

Releases are automated via GitHub Actions. When changesets are merged to main:

1. A "Version Packages" PR is created/updated
2. Merging that PR publishes to npm


