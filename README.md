# @azizuysal/wallet-kit

[![npm version](https://img.shields.io/npm/v/@azizuysal/wallet-kit.svg)](https://www.npmjs.com/package/@azizuysal/wallet-kit)
[![npm downloads](https://img.shields.io/npm/dt/@azizuysal/wallet-kit.svg)](https://www.npmjs.com/package/@azizuysal/wallet-kit)
[![npm package size](https://img.shields.io/npm/unpacked-size/@azizuysal/wallet-kit)](https://www.npmjs.com/package/@azizuysal/wallet-kit)
[![Platform - iOS](https://img.shields.io/badge/platform-iOS-lightgrey.svg)](https://developer.apple.com/ios/)
[![Platform - Android](https://img.shields.io/badge/platform-Android-brightgreen.svg)](https://developer.android.com/)
[![React Native](https://img.shields.io/badge/React%20Native-supported-blue.svg)](https://reactnative.dev/)
[![License](https://img.shields.io/github/license/azizuysal/wallet-kit)](https://github.com/azizuysal/wallet-kit/blob/main/LICENSE)
[![CI](https://github.com/azizuysal/wallet-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/azizuysal/wallet-kit/actions/workflows/ci.yml)
[![Security](https://github.com/azizuysal/wallet-kit/actions/workflows/security.yml/badge.svg)](https://github.com/azizuysal/wallet-kit/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/azizuysal/wallet-kit/graph/badge.svg?branch=main)](https://codecov.io/gh/azizuysal/wallet-kit)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=azizuysal_wallet-kit&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=azizuysal_wallet-kit)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=azizuysal_wallet-kit&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=azizuysal_wallet-kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)

A React Native library for integrating with Apple Wallet (iOS) and Google Wallet (Android), providing a unified API for adding passes to mobile wallets.

## Features

- **Cross-platform** - Apple Wallet (iOS) and Google Wallet (Android) under a unified TypeScript API.
- **Input validation** - Pass data is validated at the JS layer before reaching native code; invalid inputs fail fast with stable error codes.
- **Native UI components** - Platform-specific "Add to Wallet" buttons (`PKAddPassButton` on iOS, the official Google Wallet button on Android) with localized branding.
- **Event handling** - Subscribe to `AddPassCompleted` to learn the outcome of an add-pass flow.
- **Multiple passes on iOS** - `addPasses` presents multiple `.pkpass` files in a single Apple Wallet sheet. Google Wallet accepts a single combined JWT per call; see [Platform Differences](#platform-differences).
- **Stable error taxonomy** - A single set of error codes (`INVALID_PASS`, `ERR_WALLET_NOT_AVAILABLE`, `ERR_WALLET_UNKNOWN`, etc.) shared across platforms; see [Error Codes](#error-codes). User cancellation is reported through the `AddPassCompleted` event, not as a Promise rejection.

## Documentation

- [API Reference](https://azizuysal.github.io/wallet-kit/) — full API documentation.
- [Usage Examples](#usage) — code examples and patterns.
- [Troubleshooting](#troubleshooting) — common issues and solutions.

## Installation

```sh
npm install @azizuysal/wallet-kit
# or
yarn add @azizuysal/wallet-kit
```

## Compatibility

The 1.x series is a stabilization line focused on correctness, error handling, and input validation. It does not publish a formal React Native compatibility matrix — your React Native version determines the iOS and Android floors (see [iOS Setup](#ios-setup) and [Android Setup](#android-setup)).

The 2.x series will introduce a tested compatibility matrix, published iOS/Android floors, a narrower `peerDependencies` range, and New Architecture support via TurboModule/Fabric. If you need a specific React Native version guarantee, pin to a 2.x release when it ships.

### iOS Setup

1. Run `pod install` in the `ios` directory
2. Add the Wallet capability to your app:
   - Open your project in Xcode
   - Select your project target
   - Go to "Signing & Capabilities" tab
   - Click "+ Capability"
   - Add "Wallet"

### Android Setup

1. Ensure your app's `minSdkVersion` is compatible with the React Native version you use (React Native 0.74 requires `minSdkVersion=23`, 0.76+ requires `minSdkVersion=24`). `@azizuysal/wallet-kit` inherits the floor from your React Native version.
2. Add the following to your app's `AndroidManifest.xml`:

```xml
<application>
  <!-- Other configurations -->
  <meta-data
    android:name="com.google.android.gms.wallet.api.enabled"
    android:value="true" />
</application>
```

## Usage

### Basic Example

```typescript
import WalletKit, {
  WalletButton,
  WalletButtonStyle,
  createWalletEventEmitter,
  type WalletError,
} from '@azizuysal/wallet-kit';

// Check if device can add passes
const canAddPasses = await WalletKit.canAddPasses();
if (canAddPasses) {
  console.log('Device supports adding passes to wallet');
}

// Add a single pass
try {
  // For iOS: pass base64-encoded .pkpass file
  // For Android: pass JWT token string
  await WalletKit.addPass(passData);
  console.log('Pass addition UI shown');
} catch (error) {
  const walletError = error as WalletError;
  if (walletError.code === 'INVALID_PASS') {
    console.error('Pass data was rejected:', walletError.message);
  } else {
    console.error('Failed to present wallet sheet:', walletError);
  }
}
// User cancellation is reported via the AddPassCompleted event, not via a
// rejection. See the "Listening to Events" section below.

// Add multiple passes (iOS accepts any count; Android requires a single combined JWT)
try {
  await WalletKit.addPasses([pass1, pass2, pass3]);
} catch (error) {
  const walletError = error as WalletError;
  if (walletError.code === 'ERR_WALLET_MULTIPLE_NOT_SUPPORTED') {
    // Android: combine your passes into a single JWT server-side and call addPass instead.
  } else {
    console.error('Failed to add passes:', walletError);
  }
}
```

### Using the Native Button

```tsx
import { WalletButton, WalletButtonStyle } from '@azizuysal/wallet-kit';

function MyComponent() {
  const handleAddPass = async () => {
    try {
      await WalletKit.addPass(passData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <WalletButton
      style={{ width: 200, height: 48 }}
      addPassButtonStyle={WalletButtonStyle.primary}
      onPress={handleAddPass}
    />
  );
}
```

### Listening to Events

```typescript
import { createWalletEventEmitter } from '@azizuysal/wallet-kit';

const eventEmitter = createWalletEventEmitter();

const subscription = eventEmitter.addListener(
  'AddPassCompleted',
  (success: boolean) => {
    console.log('Pass added successfully:', success);
  }
);

// Don't forget to remove the listener when done
subscription.remove();
```

## API Reference

For complete API documentation, see the [API Reference](https://azizuysal.github.io/wallet-kit/).

### Error Codes

All methods reject with an `Error` whose `code` property is one of:

#### Pass validation

- `INVALID_PASS` — Pass data is missing, empty, or not in a recognized wallet pass format (neither a base64-encoded `.pkpass` nor a JWT). This can be raised either by the JS layer (before the native call) or by the native layer.
- `UNSUPPORTED_VERSION` — The pass version is not supported (iOS only).

#### Platform availability

- `ERR_WALLET_NOT_AVAILABLE` — The wallet app is not available on the device.
- `ERR_WALLET_ACTIVITY_NULL` — Android only: no activity was attached when the call was made.

#### Android-specific API constraints

- `ERR_WALLET_MULTIPLE_NOT_SUPPORTED` — Android only: `addPasses` was called with more than one entry. The Google Wallet API only accepts a single JWT per call; combine multiple passes into one JWT on your server.
- `ERR_WALLET_IN_PROGRESS` — Android only: another add-pass call is already in flight. Wait for it to resolve or reject before issuing another.

#### Generic

- `ERR_WALLET_UNKNOWN` — An unexpected error occurred.

#### User cancellation

User cancellation is **not** reported as a Promise rejection on either platform. The `addPass` / `addPasses` promise resolves when the wallet sheet is presented; the final outcome (added vs. cancelled) is delivered via the `AddPassCompleted` event. See [Listening to Events](#listening-to-events) for the correct pattern.

## Platform Differences

### Pass Data Format

**iOS** requires base64-encoded .pkpass files:

```typescript
const passData = await RNFS.readFile('path/to/pass.pkpass', 'base64');
```

**Android** requires JWT tokens:

```typescript
const passData = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Button Appearance

The native buttons follow platform-specific design guidelines:

- **iOS**: Uses Apple's PKAddPassButton
- **Android**: Uses official Google Wallet button layouts

## Troubleshooting

### iOS Issues

1. **"The package doesn't seem to be linked"**
   - Run `cd ios && pod install`
   - Rebuild the app

2. **"Can't add passes"**
   - Ensure Wallet capability is added in Xcode
   - Check that the device has Wallet app installed

### Android Issues

1. **"Google Wallet is not available"**
   - Ensure Google Play Services is up to date
   - Check that the device has Google Wallet installed
   - Verify the meta-data is added to AndroidManifest.xml

2. **"Activity is null"**
   - Ensure you're calling the methods after the app is fully initialized

## Testing

### iOS Testing

The example app includes sample `.pkpass` files in `example/ios/Samples/` directory. These are automatically loaded when running the iOS example app.

### Android Testing

To test the Android implementation, you will need to generate a signed JWT. For detailed instructions on how to generate a test JWT, please see the [JWT Generation Guide](./scripts/README.md).

## Example App

Check the `example` directory for a complete working example with both iOS and Android implementations.

```bash
cd example
yarn install
cd ios && pod install && cd ..
yarn ios # or yarn android
```

## Security

Found a security vulnerability? Please refer to our [security policy](SECURITY.md) for reporting procedures.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## Release Process

This package uses automated releases via GitHub Actions. See [RELEASING.md](RELEASING.md) for details on the release process.

## License

MIT
