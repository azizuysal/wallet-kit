# Release Process

This document describes how to release a new version of `@azizuysal/wallet-kit`.

## Automated Releases

The package uses GitHub Actions for automated releases. There are three ways to release:

### 1. Standard Release (Recommended)

For regular releases, use the GitHub Actions UI:

1. Go to the [Actions tab](https://github.com/azizuysal/wallet-kit/actions)
2. Select "Manual Release" workflow
3. Click "Run workflow"
4. Enter the version (e.g., `1.0.0`)
5. Select NPM tag (`latest` for stable releases)
6. Set "Dry run" to `true` first to preview
7. If preview looks good, run again with "Dry run" set to `false`

### 2. Pre-release (RC/Beta/Alpha)

For testing releases before stable:

1. Go to the [Actions tab](https://github.com/azizuysal/wallet-kit/actions)
2. Select "Pre-release" workflow
3. Choose pre-release type (rc, beta, or alpha)
4. Choose version increment (major, minor, or patch)
5. The workflow will automatically:
   - Create the appropriate version (e.g., `1.0.0-rc.1`)
   - Publish to NPM with the correct tag
   - Create a GitHub release

### 3. Tag-based Release

Push a tag to trigger automatic release:

```bash
# Update version in package.json first
npm version 1.0.0 --no-git-tag-version
git add package.json
git commit -m "chore: release 1.0.0"

# Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main
git push origin v1.0.0
```

The workflow will automatically:

- Verify tests pass
- Build the package
- Create GitHub release
- Publish to NPM

## NPM Token Setup

Before releasing, ensure the NPM token is configured:

1. Generate an NPM token:

   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to Account Settings → Access Tokens
   - Generate a new "Automation" token

2. Add to GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add a new secret named `NPM_TOKEN`
   - Paste the token value

## Version Guidelines

Follow semantic versioning:

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

Pre-release versions:

- **RC** (1.0.0-rc.1): Release candidate, feature complete
- **Beta** (1.0.0-beta.1): Feature complete, may have bugs
- **Alpha** (1.0.0-alpha.1): Early testing, unstable

## Pre-release Testing

Before releasing 1.0.0:

1. Release an RC version:

   ```bash
   # Use the Pre-release workflow
   # Select: rc, minor/major as appropriate
   ```

2. Test in a real project:

   ```bash
   npm install @azizuysal/wallet-kit@rc
   ```

3. Verify everything works:

   - iOS pass addition
   - Android pass addition
   - TypeScript types
   - Build process

4. If issues found, fix and release new RC:

   ```bash
   # Fix issues, then run Pre-release workflow again
   # It will automatically increment to rc.2, rc.3, etc.
   ```

5. Once stable, release the final version using Manual Release workflow

## Rollback Process

If a release has issues:

1. **Mark as deprecated on NPM** (if critical):

   ```bash
   npm deprecate @azizuysal/wallet-kit@1.0.0 "Critical bug, use 1.0.1"
   ```

2. **Fix the issue**

3. **Release a patch version**:
   - Use Manual Release workflow
   - Increment patch version

## Changelog

The changelog is automatically generated from commit messages. Follow conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

## Local Release (Not Recommended)

If you need to release locally:

```bash
# Ensure you're on main branch with latest changes
git checkout main
git pull

# Run tests
yarn test

# Build
yarn prepare

# Login to NPM
npm login

# Release
yarn release

# This will:
# - Update version
# - Generate changelog
# - Create git tag
# - Push to git
# - Publish to NPM
```

## Troubleshooting

### NPM 403 Error

- Check NPM_TOKEN is valid
- Ensure you have publish permissions
- Token might be expired, generate a new one

### Tag Already Exists

- Delete the tag: `git push --delete origin v1.0.0`
- Delete locally: `git tag -d v1.0.0`
- Try again

### Build Fails

- Check CI logs for errors
- Ensure all tests pass locally
- Verify TypeScript builds: `yarn typecheck`
