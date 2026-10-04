# Release process

Wallet Kit publishes only from an annotated `v*` tag through `.github/workflows/release.yml`. The repository has no manual workflow that can bypass compatibility or security gates.

## Required checks

Automated tests and CI are the release gates. No separate release-evidence folder, downloaded log archive, checksum manifest, or manual device sign-off is required.

For the exact release commit:

- Required branch checks must pass before tagging: immutable Yarn install, lint, TypeScript, Jest coverage thresholds, Builder Bob build, TypeDoc, Codegen, package inspection, secret scans, and security checks.
- The tag workflow must pass the full compatibility and security workflows before publishing. Compatibility checks install the packed tarball into consumer apps, run native tests, build Android and iOS across `compatibility.json`, and run the current-stable emulator and simulator smoke checks.
- README and changelog must match the package contents and supported behavior.

Do not tag while required branch checks are pending or failed. Use CI job results directly to confirm the automated checks.

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
