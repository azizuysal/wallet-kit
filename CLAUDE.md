# Repository guidance

`@azizuysal/wallet-kit` is a React Native library for Apple Wallet `.pkpass` files and Google Wallet JWTs. iOS and Android are the only supported platforms.

## Public contract

- `canAddPasses(): Promise<boolean>` checks platform availability.
- `addPass(passData): Promise<boolean>` resolves after the wallet flow with `true` for a newly added pass and `false` for cancellation or an already-present Apple Wallet pass.
- `addPasses(passDataArray): Promise<boolean>` supports multiple passes on iOS. Android accepts one combined JWT and rejects arrays containing multiple entries.
- `createWalletEventEmitter()` and raw-boolean `AddPassCompleted` events are deprecated outcome channels retained throughout 2.x.
- `WalletButtonStyle.outline` is a deprecated alias of `secondary` retained throughout 2.x.

## Toolchain and commands

The repository uses the versions in `.mise.toml` and Yarn 4.18.0. Run managed tools through mise:

```sh
mise exec -- corepack yarn install --immutable
mise exec -- corepack yarn verify
```

`yarn verify` runs manifest/resource/secret validation, lint, TypeScript, Jest coverage, Builder Bob, TypeDoc, Codegen, and package-content inspection.

Generate the React Native Test App native projects only when needed:

```sh
mise exec -- corepack yarn workspace @azizuysal/wallet-kit-example configure --force --platforms android ios
```

## Architecture

- `src/index.tsx`: public wrapper, validation, stable errors, and deprecated event adapter.
- `src/specs`: TurboModule and Fabric Codegen specs.
- `ios/WalletKit.mm`: shared iOS behavior plus Legacy/TurboModule registration.
- `ios/WalletButton.mm`: Legacy view manager or Fabric component view selected at compile time.
- `ios/tests`: injectable native XCTest coverage.
- `android/src/main`: shared wallet behavior, host adapter, button view, and package registration.
- `android/src/legacy`: bridge module and view-manager adapters.
- `android/src/newarch`: generated-spec TurboModule and Fabric manager adapters.
- `android/src/test`: injectable native unit tests.
- `compatibility.json`: the only source of supported exact React Native, React, and architecture pins.
- `example`: React Native Test App source and minimal project configuration.

React Native 0.76-0.81 support both architectures. React Native 0.82 and later force the New Architecture even if a stale host property requests Legacy.

## Native behavior

Both platforms validate input defensively, permit one active add operation, settle it exactly once, emit the compatibility event only when listeners exist, and reject host teardown. iOS presents from `RCTPresentedViewController()` on the main queue. Android uses `reactApplicationContext.currentActivity` and an injectable `PayClient` adapter.

Android button resources must pass `scripts/validate-android-resources.mjs`. Do not add invalid locale qualifiers, `sp` geometry, duplicate accessibility nodes, or blank fallback views.

## Release boundary

Do not commit, tag, push, publish, or deploy without explicit authorization. Tag publication is governed by `RELEASING.md`; the workflow publishes npm with provenance before creating the GitHub release.
