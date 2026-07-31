# Wallet Kit React Native Test App

The example uses `react-native-test-app` rather than checked-in application templates. It exercises availability, final promise outcomes, deprecated event compatibility, and every native button style.

From the repository root:

```sh
mise exec -- corepack yarn install --immutable
mise exec -- corepack yarn workspace @azizuysal/wallet-kit-example build:android
mise exec -- corepack yarn workspace @azizuysal/wallet-kit-example build:ios
mise exec -- corepack yarn workspace @azizuysal/wallet-kit-example configure --force --platforms android ios
```

The production bundles are included as React Native Test App resources, so generated Release builds run without a Metro server.

Run Android:

```sh
mise exec -- corepack yarn example android
```

Install iOS pods and run iOS:

```sh
cd example
mise exec -- bundle exec pod install --project-directory=ios
mise exec -- corepack yarn ios
```

## iOS samples

The non-secret `.pkpass` fixtures are in `samples/ios` and are included through `app.json`.

## Android test JWT

Android intentionally has no bundled JWT. Generate a JWT with dedicated test credentials by following [`scripts/README.md`](../scripts/README.md), then copy the output to:

```text
example/android/app/src/main/assets/samples/demo.jwt
```

The native project is generated locally, so create the directories if needed. JWT files and credential files are ignored by Git. Never use or commit production issuer credentials.
