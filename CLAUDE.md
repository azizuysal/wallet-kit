# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@azizuysal/wallet-kit` is a React Native library that wraps Apple Wallet (PassKit) on iOS and Google Wallet (`play-services-pay`) on Android behind a single TypeScript API. Both platforms are implemented.

The library exposes:

- `WalletKit.canAddPasses()` — availability check.
- `WalletKit.addPass(passData)` — add a single pass. `passData` is a base64-encoded `.pkpass` on iOS or a JWT string on Android.
- `WalletKit.addPasses(passDataArray)` — add multiple passes. On iOS any count is allowed; on Android only a single JWT is accepted and the call rejects with `ERR_WALLET_MULTIPLE_NOT_SUPPORTED` otherwise.
- `createWalletEventEmitter()` — returns a `NativeEventEmitter` that dispatches `AddPassCompleted` with a raw boolean payload (`true` when the pass was newly added in this session, `false` when the user cancelled or the pass was already in the library).
- `WalletButton` — platform-specific native button (`PKAddPassButton` on iOS, Google Wallet button on Android) with a unified `WalletButtonStyle` enum.
- `detectPassType(passData)` — utility to classify a pass string as `'pkpass'`, `'jwt'`, or `'unknown'`. Used internally to validate inputs before they reach the native layer.

## Development Commands

### Building and Testing

```bash
# Install dependencies (uses Yarn workspaces)
yarn install

# Build the library
yarn prepare

# Run type checking
yarn typecheck

# Run linting (prettier + eslint)
yarn lint

# Run Jest tests
yarn test

# Clean build artifacts
yarn clean

# Run a specific test file
yarn test src/__tests__/index.test.tsx
```

### Example App Development

```bash
# Navigate to example directory
cd example

# Install iOS dependencies
cd ios && pod install && cd ..

# Run iOS example
yarn ios

# Run Android example
yarn android
```

### Release Process

```bash
# Create a new release (handles version bumping, changelog, git tags, and npm publish)
yarn release
```

## Architecture

### File Layout

- `src/index.tsx` — public entry point. Wraps the native module with JS-layer input validation and exports the public API.
- `src/WalletButton.types.ts` — shared types (`WalletButtonStyle`, `WalletButtonProps`, `NativeWalletButtonProps`).
- `src/WalletButton.ios.tsx` — iOS implementation of `WalletButton`. Maps `WalletButtonStyle` values to `PKAddPassButton` style integers.
- `src/WalletButton.android.tsx` — Android implementation of `WalletButton`. Maps `WalletButtonStyle` values to Google Wallet button themes.
- `ios/WalletKit.mm` — Objective-C++ module using PassKit. Implements the `WalletKit` native module.
- `ios/WalletButton.mm` — `UIViewManager` for `PKAddPassButton`.
- `ios/UIViewController+WalletKit.h` — category for locating the top-most view controller to present the add-pass sheet over.
- `android/src/.../WalletKitModule.kt` — Kotlin module using `com.google.android.gms:play-services-pay`. Implements the same surface as the iOS module.
- `android/src/.../WalletButtonManager.kt` — view manager for the Google Wallet button.
- `android/src/.../WalletKitPackage.kt` — React Native package registration.

### Platform file resolution

`src/index.tsx` imports `WalletButton` from `./WalletButton`. Metro resolves this to `WalletButton.ios.tsx` or `WalletButton.android.tsx` automatically based on the consumer's build target. TypeScript uses `moduleSuffixes: [".ios", ".android", ""]` in `tsconfig.json` to match.

### JS-layer validation

The JS wrapper in `src/index.tsx` runs input validation before delegating to the native module:

- `addPass` rejects empty/non-string input with `INVALID_PASS`.
- `addPass` rejects unrecognized formats (via `detectPassType`) with `INVALID_PASS` before touching native.
- `addPasses` rejects empty arrays and non-string entries with `INVALID_PASS`.
- `addPasses` rejects multi-entry calls on Android with `ERR_WALLET_MULTIPLE_NOT_SUPPORTED`.

Native modules repeat the same checks defensively — tests and consumer mistakes that somehow bypass the JS layer still get a clean rejection rather than a native crash or silent data drop.

## Testing

JavaScript/TypeScript tests live in `src/__tests__/` using Jest with the `react-native` preset. `jest.setup.js` mocks `react-native`'s `NativeModules`, `NativeEventEmitter`, and `requireNativeComponent`.

- `src/__tests__/index.test.tsx` — exercises the JS wrapper including validation, error propagation, event emitter behavior, and integration flows.
- `src/__tests__/WalletButton.test.tsx` — imports `WalletButton.ios.tsx` and `WalletButton.android.tsx` directly via `describe.each`, so both platform implementations are covered in a single Jest run without Platform.OS gymnastics.

Native code (iOS `.mm`, Android `.kt`) is not exercised by Jest. A CI matrix that builds the library against a range of React Native versions will be introduced in the 2.x series.

## API Surface Reference

### Event payload

The `AddPassCompleted` event payload is a **raw boolean** (not an object):

```typescript
const emitter = createWalletEventEmitter();
emitter.addListener('AddPassCompleted', (success: boolean) => {
  // success === true  -> pass newly added in this session
  // success === false -> user cancelled, or all passes were already present
});
```

## Common Development Tasks

When adding new functionality:

1. Add TypeScript types and validation in `src/index.tsx` (or a new module).
2. Implement in both native modules (iOS and Android).
3. Add JS-level validation tests in `src/__tests__/` — tests must assert real intended behavior, not mock-and-pass.
4. Update the example app if the feature is user-visible.
5. Update README and CHANGELOG.

When extending error handling:

1. Add the new code to `WalletErrorCode` in `src/index.tsx`.
2. Document it in the README "Error Codes" section.
3. Emit the code from both the JS validation layer and the native layer as appropriate.
4. Add tests that verify the code is surfaced correctly.
