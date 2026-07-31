# Release process

Wallet Kit publishes only from an annotated `v*` tag through `.github/workflows/release.yml`. The repository has no manual workflow that can bypass compatibility or security gates.

## Required evidence before tagging

A maintainer must confirm all of the following for the exact release commit:

- Immutable Yarn install, lint, TypeScript, Jest coverage thresholds, Builder Bob build, TypeDoc, Codegen, package inspection, and secret scans pass.
- The scheduled/release compatibility workflow passes every entry in `compatibility.json`: Android and iOS Debug for every cell, both architectures through React Native 0.81, New Architecture from 0.82, and Release builds for the oldest Legacy and latest New cells.
- The packed tarball, not a workspace link, is what each compatibility app installs.
- OSV Scanner, Yarn audit, CodeQL, and dependency review have no blocking findings. Snyk must pass when `SNYK_TOKEN` is configured; a missing token is reported as an explicit skip.
- Current-stable Android and iOS simulator launch evidence shows the packed module linking and native button rendering. Android CI also presses the native button and verifies the JavaScript callback path.
- Dedicated physical-device credentials outside the repository pass the manual checklist below.
- README and changelog match the evidence and package contents.

Do not tag a release while any required gate is pending or failed.

## Manual device checklist

Use dedicated test issuer and Apple pass credentials. Never use founder, customer, or production credentials.

### iPhone

- Add a valid signed pass.
- Cancel the sheet and verify the promise resolves `false`.
- Submit an already-present pass and verify `false`.
- Add multiple valid passes and verify the final aggregate outcome.

Hiding Wallet with Screen Time is not an unavailable-wallet test. It hides the app without disabling PassKit, so `canAddPasses()` may still return `true`. Verify iOS unavailable-wallet and controller-creation failures through the injectable native tests.

### Android with Google Play Services

- Add a valid issuer JWT and verify `true`.
- Cancel and verify `false`.
- Test unavailable-wallet behavior.
- Interrupt the host lifecycle while an operation is active and verify one rejection with no later duplicate settlement.
- Check standard and condensed Google Wallet button rendering and press behavior.

Record the app build, device/OS versions, credential identity, date, and result outside the repository. Never record key material or signed production payloads.

## Prepare the release commit

1. Update `package.json` to the intended semantic version.
2. Move the relevant changelog entries from `Unreleased` into that version.
3. Run the local checks:

   ```sh
   mise exec -- corepack yarn install --immutable
   mise exec -- corepack yarn verify
   ```

4. Commit the version and changelog with a conventional commit.
5. Push the release commit and wait for required branch checks.
6. Create and push an annotated tag whose value exactly matches `package.json`, for example `v2.0.0`.

Tag creation and push are publication-authorizing actions. Perform them only after the release owner has explicitly approved that exact version and commit.

## Automated publication order

The tag workflow:

1. Runs the full reusable compatibility workflow.
2. Runs the full reusable security workflow.
3. Repeats all package checks and verifies the tag/version match.
4. Publishes to npm with `npm publish --access public --provenance`. Prerelease tags use npm's `next` channel.
5. Extracts the matching version section from `CHANGELOG.md` and creates the GitHub release with those curated notes only after npm succeeds.

This order prevents a failed npm publication from leaving a misleading successful GitHub release. The `npm-production` GitHub environment should require maintainer approval. Configure `NPM_TOKEN` as an environment secret and retain `id-token: write` for provenance. Never print or place the token in repository files.

## Failure handling

If any pre-publication job fails, fix the cause on a new commit and create a new version/tag as appropriate. Do not move or overwrite an existing published tag.

If npm succeeds but GitHub release creation fails, do not republish the npm version. Re-run or create the GitHub release for the existing immutable tag after verifying the npm artifact and provenance.
