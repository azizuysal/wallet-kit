# Contributing

Contributions are welcome. Follow the [code of conduct](CODE_OF_CONDUCT.md) and keep pull requests focused on one behavior.

## Development setup

The repository uses mise-managed Node 24, Java 17, and Ruby 3.3, plus Yarn 4.18.0 workspaces. Do not use npm to install workspace dependencies.

```sh
mise exec -- corepack yarn install --immutable
```

The example is a React Native Test App. Regenerate its native projects after dependency or native configuration changes:

```sh
mise exec -- corepack yarn workspace @azizuysal/wallet-kit-example configure --force --platforms android ios
```

Run the example from the repository root:

```sh
mise exec -- corepack yarn example start
mise exec -- corepack yarn example android
mise exec -- corepack yarn example ios
```

iOS also requires CocoaPods:

```sh
cd example
mise exec -- bundle exec pod install --project-directory=ios
```

Android test JWTs and all signing credentials stay outside version control. Follow [`scripts/README.md`](scripts/README.md).

## Required checks

Run the same combined local gate used by CI:

```sh
mise exec -- corepack yarn verify
```

Bug fixes require a focused regression test. Features require the primary happy path and meaningful failure cases. Native behavior changes should update the relevant Android unit tests or iOS XCTest cases as well as JavaScript coverage.

The compatibility workflow installs the packed tarball into isolated consumer apps. Update `compatibility.json` only when both platforms and the allowed architectures for that exact React Native patch are intended to become release-blocking.

## Style

- Match existing TypeScript, Objective-C++, Kotlin, and native adapter patterns.
- Use stable error codes and fail visibly; do not swallow native failures.
- Do not silence type, lint, or compiler findings.
- Use conventional commit messages such as `fix:`, `feat:`, `docs:`, `test:`, and `chore:`.
- Do not include credentials, signed production passes, generated native build output, or decorative emoji.

## Releases

Contributors do not publish locally. Maintainers follow [RELEASING.md](RELEASING.md), including the full compatibility, security, package, simulator, and physical-device evidence gates.
