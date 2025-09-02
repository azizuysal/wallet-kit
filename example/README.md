# Wallet Kit Example App

This directory contains a working example of the `@azizuysal/wallet-kit` library.

## Getting Started

For instructions on how to run this example app, please see the [Example App section of the main README.md file](../README.md#example-app).

## Android Setup: Creating a Test JWT

The Android example app is hardcoded to load a JWT from `android/app/src/main/assets/samples/demo.jwt`.

To run the example, you must generate your own signed JWT and save it to that location.

1.  **Generate a JWT:** Follow the [JWT Generation Guide](../scripts/README.md) to generate a new JWT.

2.  **Save the JWT:** Save the generated JWT to the following path:

    ```
    example/android/app/src/main/assets/samples/demo.jwt
    ```

    You may need to create the `samples` directory if it does not exist.
