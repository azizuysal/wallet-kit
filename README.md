# @azizuysal/wallet-kit

A React Native library for integrating with Apple Wallet (iOS) and Google Wallet (Android), providing a unified API for adding passes to mobile wallets.

## Features

- ✅ **Cross-platform support** - Works with both Apple Wallet and Google Wallet
- ✅ **TypeScript support** - Fully typed API with comprehensive JSDoc documentation
- ✅ **Native UI components** - Platform-specific "Add to Wallet" buttons
- ✅ **Event handling** - Listen for pass addition completion events
- ✅ **Multiple passes** - Support for adding single or multiple passes at once
- ✅ **Error handling** - Detailed error codes for different failure scenarios

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
  createWalletEventEmitter 
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
  if (error.code === 'USER_CANCELLED') {
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
import { createWalletEventEmitter, type AddPassCompletedEvent } from '@azizuysal/wallet-kit';

const eventEmitter = createWalletEventEmitter();

const subscription = eventEmitter.addListener(
  'AddPassCompleted',
  (success: AddPassCompletedEvent) => {
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

#### `AddPassCompletedEvent`
Event that returns a boolean value indicating whether the pass was successfully added to the wallet.

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

Android requires properly signed JWT tokens for Google Wallet. Follow these steps to set up testing:

#### Prerequisites

1. **Emulator or Device Requirements**:
   - Use an emulator with **Google Play** (not Google APIs only)
   - Or use a physical Android device
   - Sign in with a Google account on the device
   - Ensure internet connection is working

2. **Google Wallet App** (Optional but recommended):
   - Install from Google Play Store if available in your region

#### Setting Up Demo Account (Required)

Google Wallet requires properly signed JWTs, even for testing. Create a free demo issuer account:

##### Step 1: Create Google Wallet Issuer Account (2-3 minutes)

1. Go to [Google Pay & Wallet Console](https://pay.google.com/business/console)
2. Click **"Get started"**
3. Sign in with your Google account
4. Your account automatically starts in **demo mode** (perfect for testing)

##### Step 2: Create a Generic Pass Class

1. In the console, find the **"Google Wallet API"** card
2. Click **"Manage passes"**
3. Click **"Create a class"** → Select **"Generic"**
4. Fill in basic details:
   - Class ID: `test_class_001` (or any unique ID)
   - Class name: `Test Pass Class`
5. Save the class

##### Step 3: Generate a Test JWT

**Option A: Use Pass Builder (Easiest)**
1. Go to [Generic Pass Builder](https://developers.google.com/wallet/generic/resources/pass-builder)
2. Fill in your Issuer ID (found in console)
3. Customize the pass appearance
4. Copy the generated JSON
5. Use the JSON to create a JWT (see Option B for JWT creation)

**Option B: Use Google's Codelab Tools**
1. Visit the [Web Codelab](https://codelabs.developers.google.com/add-to-wallet-web)
2. Follow steps to create a service account
3. Use the provided code to generate JWTs programmatically

##### Step 4: Update the JWT File

Save your generated JWT to the Android assets folder:

1. Navigate to `example/android/app/src/main/assets/samples/`
2. Open `demo.jwt` file
3. Replace the contents with your newly generated JWT
4. Save the file

The app will automatically load this JWT when you press the "Add to Google Wallet" button.

#### Common Issues and Solutions

**"ERR_WALLET_CANCELLED" Error**
- **Cause**: Usually means invalid/expired JWT
- **Solution**: Generate a fresh JWT using steps above

**"ERR_WALLET_NOT_AVAILABLE" Error**
- **Cause**: Google Play Services not available
- **Solution**: 
  - Use emulator with Google Play (not Google APIs)
  - Ensure signed in to Google account
  - Check internet connection

**Emulator "No Internet" Issue**
- **Solution**: Cold boot the emulator from AVD Manager

#### Important Notes

- **Demo Mode Limitations**: 
  - Passes show "[TEST ONLY]" watermark
  - Only your test users can add passes
  - Perfect for development and testing

- **Production Access**: 
  - When ready for production, request publishing access in the console
  - Remove "[TEST ONLY]" watermark
  - Allow any user to add passes

## Example App

Check the `example` directory for a complete working example with both iOS and Android implementations.

```bash
cd example
yarn install
cd ios && pod install && cd ..
yarn ios # or yarn android
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT