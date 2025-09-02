# @azizuysal/wallet-kit

[![npm version](https://img.shields.io/npm/v/@azizuysal/wallet-kit.svg)](https://www.npmjs.com/package/@azizuysal/wallet-kit)
[![npm downloads](https://img.shields.io/npm/dt/@azizuysal/wallet-kit.svg)](https://www.npmjs.com/package/@azizuysal/wallet-kit)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@azizuysal/wallet-kit)](https://bundlephobia.com/package/@azizuysal/wallet-kit)
[![Platform - iOS](https://img.shields.io/badge/platform-iOS-lightgrey.svg)](https://developer.apple.com/ios/)
[![Platform - Android](https://img.shields.io/badge/platform-Android-brightgreen.svg)](https://developer.android.com/)
[![React Native](https://img.shields.io/badge/React%20Native-0.73+-blue.svg)](https://reactnative.dev/)
[![License](https://img.shields.io/github/license/azizuysal/wallet-kit)](https://github.com/azizuysal/wallet-kit/blob/main/LICENSE)
[![CI](https://github.com/azizuysal/wallet-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/azizuysal/wallet-kit/actions/workflows/ci.yml)
[![Security](https://github.com/azizuysal/wallet-kit/actions/workflows/security.yml/badge.svg)](https://github.com/azizuysal/wallet-kit/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/azizuysal/wallet-kit/graph/badge.svg?branch=main)](https://codecov.io/gh/azizuysal/wallet-kit)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=azizuysal_wallet-kit&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=azizuysal_wallet-kit)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=azizuysal_wallet-kit&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=azizuysal_wallet-kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/azizuysal/wallet-kit/blob/main/CONTRIBUTING.md)

A React Native library for integrating with Apple Wallet (iOS) and Google Wallet (Android), providing a unified API for adding passes to mobile wallets.

## Features

- ✅ **Cross-platform support** - Works with both Apple Wallet and Google Wallet
- ✅ **TypeScript support** - Fully typed API with comprehensive JSDoc documentation
- ✅ **Native UI components** - Platform-specific "Add to Wallet" buttons
- ✅ **Event handling** - Listen for pass addition completion events
- ✅ **Multiple passes** - Support for adding single or multiple passes at once
- ✅ **Error handling** - Detailed error codes for different failure scenarios

## Documentation

- 📖 [API Reference](https://azizuysal.github.io/wallet-kit/) - Complete API documentation
- 📚 [Usage Examples](#usage) - Code examples and patterns
- 🔧 [Troubleshooting](#troubleshooting) - Common issues and solutions

## Installation

```sh
npm install @azizuysal/wallet-kit
# or
yarn add @azizuysal/wallet-kit
```

### iOS Setup

1. Run `pod install` in the `ios` directory
2. Add the Wallet capability to your app:
   - Open your project in Xcode
   - Select your project target
   - Go to "Signing & Capabilities" tab
   - Click "+ Capability"
   - Add "Wallet"

### Android Setup

1. Ensure your `minSdkVersion` is 21 or higher
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
  if (error.code === 'ERR_WALLET_CANCELLED') {
    console.log('User cancelled the operation');
  }
}

// Add multiple passes
try {
  await WalletKit.addPasses([pass1, pass2, pass3]);
} catch (error) {
  console.error('Failed to add passes:', error);
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

### Methods

#### `canAddPasses(): Promise<boolean>`

Check if the device can add passes to the wallet.

#### `addPass(passData: string): Promise<void>`

Add a single pass to the wallet.

- **iOS**: `passData` should be a base64-encoded .pkpass file
- **Android**: `passData` should be a JWT token string

#### `addPasses(passDataArray: string[]): Promise<void>`

Add multiple passes to the wallet.

**Note:** On Android, the Google Wallet API currently only supports adding one JWT at a time. When multiple JWTs are provided, only the first one will be added. For true multi-pass support on Android, you need to combine multiple passes into a single JWT on your server side.

### Components

#### `<WalletButton />`

Native wallet button component.

**Props:**

- `addPassButtonStyle?: WalletButtonStyle` - Button style (primary, secondary, outline)
- `onPress?: () => void` - Button press handler
- Standard React Native `ViewProps`

### Types

#### `WalletButtonStyle`

Enum for button styles:

- `primary` - Black button on iOS, dark button on Android
- `secondary` - Black outline on iOS, light button on Android
- `outline` - Black outline on iOS, outline button on Android

### Error Codes

#### Pass Validation Errors

- `INVALID_PASS` - Invalid pass data format
- `UNSUPPORTED_VERSION` - Pass version not supported (iOS)

#### User Actions

- `ERR_WALLET_CANCELLED` - User cancelled the operation

#### System Availability

- `ERR_WALLET_NOT_AVAILABLE` - Wallet app not available on device
- `ERR_WALLET_ACTIVITY_NULL` - Android specific: Activity is null

#### Generic Errors

- `ERR_WALLET_UNKNOWN` - Unknown error occurred

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
- **Android**: Custom button following Material Design

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
