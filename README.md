# @azizuysal/wallet-kit

[![npm version](https://img.shields.io/npm/v/@azizuysal/wallet-kit.svg)](https://www.npmjs.com/package/@azizuysal/wallet-kit)
[![CI](https://github.com/azizuysal/wallet-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/azizuysal/wallet-kit/actions/workflows/ci.yml)
[![Native compatibility](https://github.com/azizuysal/wallet-kit/actions/workflows/compatibility.yml/badge.svg)](https://github.com/azizuysal/wallet-kit/actions/workflows/compatibility.yml)
[![Security](https://github.com/azizuysal/wallet-kit/actions/workflows/security.yml/badge.svg)](https://github.com/azizuysal/wallet-kit/actions/workflows/security.yml)
[![License](https://img.shields.io/github/license/azizuysal/wallet-kit)](LICENSE)

Add Apple Wallet passes on iOS and Google Wallet passes on Android through one React Native API. Wallet Kit includes native add-to-wallet buttons, stable error codes, final boolean outcomes, and native implementations for both React Native architectures.

## Installation

```sh
npm install @azizuysal/wallet-kit
# or
yarn add @azizuysal/wallet-kit
```

Expo Go is not supported because Wallet Kit contains native code. Expo development builds and bare React Native apps are supported after native dependencies are installed.

## Compatibility

Wallet Kit 2.x supports React Native `>=0.76` with no peer upper bound. The release-blocking range is React Native 0.76 through 0.86. Later React Native versions can be installed, but are unverified until their exact stable patch is promoted into the blocking matrix.

| React Native | Exact blocking patch | React  | Architectures  |
| ------------ | -------------------- | ------ | -------------- |
| 0.76         | 0.76.9               | 18.2.0 | Legacy and New |
| 0.77         | 0.77.3               | 18.2.0 | Legacy and New |
| 0.78         | 0.78.3               | 19.0.0 | Legacy and New |
| 0.79         | 0.79.7               | 19.0.0 | Legacy and New |
| 0.80         | 0.80.3               | 19.1.0 | Legacy and New |
| 0.81         | 0.81.6               | 19.1.4 | Legacy and New |
| 0.82         | 0.82.1               | 19.1.1 | New only       |
| 0.83         | 0.83.10              | 19.2.0 | New only       |
| 0.84         | 0.84.1               | 19.2.3 | New only       |
| 0.85         | 0.85.3               | 19.2.3 | New only       |
| 0.86         | 0.86.2               | 19.2.5 | New only       |

Every release must pass the full packed-consumer matrix in [`compatibility.json`](compatibility.json). Pull requests run the oldest, architecture boundary, and newest cells. Scheduled and release workflows run every listed cell. React Native 0.82 and later are New-Architecture-only; Wallet Kit uses generated TurboModule and Fabric implementations there rather than the compatibility interop layer.

Common platform floors are iOS 15.1, Android API 24, and Java 17. The Android library inherits the host React Native project's Android Gradle Plugin, Kotlin plugin, and SDK configuration, with API 24/36 defaults when the host does not provide values. These floors follow the [React Native 0.76 platform changes](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture); the New-Architecture-only boundary follows [React Native 0.82](https://reactnative.dev/blog/2025/10/08/react-native-0.82).

React Native below 0.76 must remain on `@azizuysal/wallet-kit@^1`.

## Native setup

### iOS

Run CocoaPods after installation and add the Wallet capability to the application target:

```sh
cd ios
pod install
```

### Android

Ensure the application uses `minSdk` 24 or later and enables the Google Wallet API:

```xml
<application>
  <meta-data
    android:name="com.google.android.gms.wallet.api.enabled"
    android:value="true" />
</application>
```

## Usage

```typescript
import WalletKit, {
  WalletButton,
  WalletButtonStyle,
  type WalletError,
} from '@azizuysal/wallet-kit';

if (await WalletKit.canAddPasses()) {
  try {
    const added = await WalletKit.addPass(passData);
    if (added) {
      console.log('Pass added');
    } else {
      console.log('Cancelled or already present');
    }
  } catch (error) {
    const walletError = error as WalletError;
    console.error(walletError.code, walletError.message);
  }
}

function AddButton() {
  return (
    <WalletButton
      addPassButtonStyle={WalletButtonStyle.primary}
      style={{ width: 200, height: 48 }}
      onPress={() => void WalletKit.addPass(passData)}
    />
  );
}
```

On iOS, `passData` is a base64-encoded `.pkpass`. On Android, it is a signed Google Wallet JWT. Generate and sign Android JWTs on a trusted server; never embed issuer private keys in a mobile application.

### Final outcomes

`addPass` and `addPasses` settle after the native wallet flow finishes:

- `true`: every submitted pass was newly added.
- `false`: the user cancelled, or at least one Apple Wallet pass was already present.
- rejection: validation, availability, presentation, lifecycle, or provider failure.

Only one add operation may be active at a time. A concurrent call rejects with `ERR_WALLET_IN_PROGRESS` and does not replace the active operation.

`addPasses` accepts multiple Apple Wallet passes. Android accepts one JWT per call; combine multiple Google Wallet objects into one signed JWT and call `addPass`, or pass a one-element array to `addPasses`. Multiple Android array entries reject with `ERR_WALLET_MULTIPLE_NOT_SUPPORTED`.

### Deprecated event compatibility

`createWalletEventEmitter` and the raw-boolean `AddPassCompleted` event remain available throughout 2.x for existing consumers. Use the promise return value for new outcome handling. The event API may be removed only in 3.x.

```typescript
import { createWalletEventEmitter } from '@azizuysal/wallet-kit';

const emitter = createWalletEventEmitter();
const subscription = emitter.addListener('AddPassCompleted', (added: boolean) =>
  console.log(added)
);

subscription.remove();
```

## Native button styles

| Style       | iOS                             | Android                              |
| ----------- | ------------------------------- | ------------------------------------ |
| `primary`   | Black `PKAddPassButton`         | Standard black Google Wallet button  |
| `secondary` | Black-outline `PKAddPassButton` | Condensed black Google Wallet button |
| `outline`   | Alias of `secondary`            | Alias of `secondary`                 |

`outline` is deprecated but remains available throughout 2.x. Android bundles Google's standard and condensed resources and valid Android locale qualifiers, following the [Google Wallet brand guidelines](https://developers.google.com/wallet/generic/resources/brand-guidelines).

## Error codes

Wallet operations reject with a `WalletError` containing one of these stable codes:

- `INVALID_PASS`: missing or unrecognized pass data.
- `UNSUPPORTED_VERSION`: unsupported Apple Wallet pass version.
- `ERR_WALLET_NOT_AVAILABLE`: the platform wallet cannot add passes or cannot create its add-pass controller.
- `ERR_WALLET_ACTIVITY_NULL`: Android has no current activity.
- `ERR_WALLET_MULTIPLE_NOT_SUPPORTED`: multiple Android array entries were supplied.
- `ERR_WALLET_IN_PROGRESS`: another add operation is active.
- `ERR_WALLET_UNKNOWN`: an availability, launch, presentation, lifecycle, or unexpected provider failure.

Cancellation is not an error and resolves with `false`.

## Migrating from 1.x

- Change outcome handling from the `AddPassCompleted` event to the boolean returned by `addPass` or `addPasses`. Existing listeners continue to work.
- Raise the application floors to iOS 15.1, Android API 24, and Java 17.
- Use React Native 0.76 or later and React 18.2 or later. Older applications remain on Wallet Kit 1.x.
- Serialize add operations on both platforms and handle `ERR_WALLET_IN_PROGRESS`.
- Replace `WalletButtonStyle.outline` with `WalletButtonStyle.secondary`; the old value remains an alias during 2.x.
- No migration is required for New Architecture apps. Codegen registers the TurboModule and Fabric component through the package metadata.

## Example and API reference

The [React Native Test App example](example/README.md) exercises availability, both promise methods, the deprecated event, and every button style. Android credentials are deliberately excluded; see the [local JWT guide](scripts/README.md).

The generated [API reference](https://azizuysal.github.io/wallet-kit/) contains the complete TypeScript surface.

## Security

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not include credentials or signed production passes in reports.

## Contributing and releases

See [CONTRIBUTING.md](CONTRIBUTING.md) for development instructions and [RELEASING.md](RELEASING.md) for the release evidence gates.

## License

MIT
