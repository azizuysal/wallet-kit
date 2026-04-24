# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased]

### Breaking Changes

- **API**: `addPass` and `addPasses` now return `Promise<boolean>` that resolves with the add outcome directly (`true` when every pass was newly added, `false` on cancel or when a pass was already in the wallet). The 1.x versions returned `Promise<void>` and delivered the outcome only via the `AddPassCompleted` event. The event is retained as a secondary channel; the Promise return value is the primary API.
  - Migration: `await WalletKit.addPass(data)` can now be used directly to get the outcome. Existing `AddPassCompleted` listeners continue to fire.
- **Peer dependencies**: `react-native` tightened from `*` to `>=0.80.0`; `react` tightened from `*` to `>=19.1.0`. Consumers on RN `< 0.80` must stay on `@azizuysal/wallet-kit@^1`.
- **iOS platform floor**: `wallet-kit.podspec` raised from `ios 11.0` to `ios 15.1` (matches the RN 0.80–0.85 floor).
- **Android build floor**: `minSdkVersion` raised from 21 to 24 (RN 0.76+ floor). `compileSdk`/`targetSdk` moved to 36. `kotlinVersion` moved to 2.1.20. AGP moved to 8.12. Java source/target moved to 17.
- **iOS**: `addPass`/`addPasses` now reject concurrent in-flight calls with `ERR_WALLET_IN_PROGRESS` (previously an iOS-specific latent bug — Phase 1 had this guard on Android only).

### Features

- New TurboModule + Fabric Codegen spec so the library runs natively on the New Architecture from RN 0.82+ without going through the interop layer. Bridge-era native code is retained behind `#ifdef RCT_NEW_ARCH_ENABLED` for 0.80/0.81 old-arch consumers.
- Compatibility matrix published in README: tested against RN 0.80, 0.81, 0.82, 0.83, 0.84, 0.85 (per the CI matrix added in P2-c).

### Chores

- Upgraded the in-repo example app to React Native 0.85.2, React 19.2.5.
- Upgraded library devDependencies to match: `@react-native/eslint-config` 0.85.2, `@react-native/jest-preset` 0.85.2, `@react-native/babel-preset` 0.85.2, `@react-native-community/cli` 20.1.3, ESLint 9 (flat config), TypeScript 5.9, Commitlint 20, Prettier 3.8.
- Removed vestigial `turbo` devDependency and `turbo.json`.
- Removed the `create-react-native-library.type: "legacy-module"` package.json block.
- Split `ios/UIViewController+WalletKit.h`'s inline `@implementation` into a proper `.h` / `.mm` pair to avoid duplicate-symbol risk from the Codegen work.
- Migrated `src/__tests__/WalletButton.test.tsx` from `react-test-renderer` to `@testing-library/react-native` (React 19 compat).
- Upgraded all GitHub Actions and added a CI matrix covering 6 RN versions × 2 OS.

### Removed

- Bridge-era-only code paths that assumed `newArchEnabled=false` was always possible. Bridge code is still present on the iOS/Android sides behind `#ifdef` / `newArchEnabled` checks, but it is no longer the default build path.

## [1.1.0] - 2026-04-23

### Bug Fixes

- **iOS**: decode pass data with `NSDataBase64DecodingIgnoreUnknownCharacters` and explicitly reject nil data so pass strings containing whitespace or newlines no longer cause undefined `PKPass` initialization.
- **iOS**: `addPasses` now scopes `NSError` per-iteration and rejects with the exact failing index instead of leaking stale errors between loop iterations.
- **iOS**: handle sheet swipe-dismissal on iOS 13+ via `UIAdaptivePresentationControllerDelegate`, cleaning up tracked passes and emitting `AddPassCompleted` so callers are no longer left hanging.
- **iOS**: success detection now compares a pre-add library snapshot against the post-add state, so passes that were already in the wallet before the call no longer falsely report as "added."
- **Android**: concurrent `addPass` calls are now rejected with `ERR_WALLET_IN_PROGRESS` instead of silently overwriting the pending promise of an in-flight call.
- **Android**: pending promises are now rejected with `ERR_WALLET_UNKNOWN` when the host activity is destroyed or the React Native module is invalidated before Google Wallet returns a result. Previously the promise would be leaked and never settle. Implemented via `LifecycleEventListener.onHostDestroy` and `ReactContextBaseJavaModule.invalidate()`.
- **Android**: `addPasses` with more than one entry now rejects with `ERR_WALLET_MULTIPLE_NOT_SUPPORTED` instead of silently dropping entries with a log warning.
- **Android**: `canAddPasses` rejects with `ERR_WALLET_UNKNOWN` and the real exception on failure instead of resolving `false` and hiding the error.
- **Android**: empty or null pass data now rejects with `INVALID_PASS` to match iOS and the documented error taxonomy.
- **Android**: listener count is now managed via `AtomicInteger` and clamped at zero, fixing a thread-safety / underflow issue.
- **Android**: `PayClient` is initialized once in the module constructor instead of being re-assigned on every call.
- **Android**: removed an unreachable `android.util.Log.w` call in `addPasses`.
- **JS**: `addPass` and `addPasses` now validate input at the JS layer before hitting native — empty, non-string, and unrecognized pass formats reject with `INVALID_PASS` immediately via `detectPassType`.
- **JS**: `addPasses` on Android rejects with `ERR_WALLET_MULTIPLE_NOT_SUPPORTED` before the native call when the array has more than one entry.

### Features

- New error codes added to `WalletErrorCode`:
  - `ERR_WALLET_MULTIPLE_NOT_SUPPORTED` — Android: multi-entry `addPasses` calls are not supported by the Google Wallet API.
  - `ERR_WALLET_IN_PROGRESS` — Android: a previous add-pass call is still awaiting a result.
- New exported `WalletError` interface describing the error shape rejected by WalletKit promises.

### Removed

- `ERR_WALLET_CANCELLED` removed from the `WalletErrorCode` union. Neither platform ever rejected with this code — user cancellation is, and always has been, reported through the `AddPassCompleted` event (with `success === false`), not as a Promise rejection. The code was listed in the type system and docs but unreachable, which misled consumers into writing dead `catch` branches. Consumers who previously wrote `if (error.code === 'ERR_WALLET_CANCELLED')` should subscribe to `AddPassCompleted` via `createWalletEventEmitter` instead.
  - **JavaScript runtime impact: none.** No platform ever emitted this code, so any runtime `catch (error) { if (error.code === 'ERR_WALLET_CANCELLED') ... }` branch was already dead and is unaffected.
  - **TypeScript impact: type-level only.** Code that references the string literal `'ERR_WALLET_CANCELLED'` as a `WalletErrorCode` value will produce a compile error after upgrading. The intended migration is to delete the dead branch and observe cancellation via the event emitter.

### Code Refactoring

- Split `src/WalletButton.tsx` into `src/WalletButton.ios.tsx`, `src/WalletButton.android.tsx`, and `src/WalletButton.types.ts`. Removes the unsafe `Platform.OS` cast in favor of compile-time platform resolution via Metro and `moduleSuffixes`.

### Tests

- Replaced tests that mock-and-pass on invalid input with tests that assert the intended rejection behavior. JS test suite now covers the full public surface, including JS-layer validation paths.
- Restructured `WalletButton.test.tsx` to import both platform implementations directly, removing runtime `Platform.OS` manipulation.

### Documentation

- README: removed decorative emojis per project style; documented the new error codes; added a "Compatibility" section clarifying that formal React Native support ranges arrive in 2.x.
- Project `CLAUDE.md` rewritten: the previous claim that Android was not implemented was incorrect; the event payload is documented as a raw boolean (not `{ success }`); added the file-layout and platform file-resolution sections.

## [1.0.0] - 2025-09-20

### Features

- Implement Android support with Google Wallet integration
- Implement official Google Wallet button with proper branding and localization
- Implement Android button styles with iOS parity
- Improve JWT generator and update documentation

### Bug Fixes

- Standardize error handling and event format across platforms
- Improve Android wallet integration and documentation
- Add localization support to example project
- Fix Android build issues
- Generate HTML docs instead of markdown for GitHub Pages
- Resolve all GitHub Actions workflow failures
- Resolve SonarCloud and Security workflow issues

### Documentation

- Consolidate Android testing documentation and refactor example app
- Fix README inaccuracies
- Change downloads badge to show total downloads instead of monthly

### Tests

- Improve test coverage and consolidate test files

### BREAKING CHANGES

- WalletButtonStyle enum values changed to be platform-agnostic

## [0.2.1] - 2024-08-15

### Fixed

- Included PassKit framework in podspec for proper iOS integration

## [0.2.0] - 2024-08-14

### Added

- Initial public release on NPM registry
- iOS implementation with Apple Wallet support
- TypeScript definitions
- Example application

### Changed

- Updated package name to @azizuysal/wallet-kit
- Added public access configuration for NPM

## [0.1.0] - 2024-08-13

### Added

- Initial iOS implementation with PassKit framework
- Basic API for adding passes to Apple Wallet
- Native button component for iOS
- Event handling system
- Error handling with specific error codes

[Unreleased]: https://github.com/azizuysal/wallet-kit/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/azizuysal/wallet-kit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/azizuysal/wallet-kit/compare/v0.2.1...v1.0.0
[0.2.1]: https://github.com/azizuysal/wallet-kit/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/azizuysal/wallet-kit/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/azizuysal/wallet-kit/releases/tag/v0.1.0
