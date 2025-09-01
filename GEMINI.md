# @azizuysal/wallet-kit Gemini Assistant Context

This document provides context for the Gemini AI assistant to understand and effectively assist with the development of the `@azizuysal/wallet-kit` project.

## Project Overview

`@azizuysal/wallet-kit` is a React Native library that provides a unified interface for developers to interact with Apple Wallet (on iOS) and Google Wallet (on Android). The library allows for adding passes (like loyalty cards, boarding passes, etc.) to the native wallet applications on both platforms.

**Key Technologies:**

- **React Native:** The core framework for building the cross-platform library.
- **TypeScript:** The primary language used for development, providing strong typing and better developer experience.
- **Native Modules:** The library uses native modules written in Objective-C (for iOS) and Kotlin (for Android) to bridge the gap between JavaScript and the native Wallet APIs.
- **Yarn Workspaces:** The project is structured as a monorepo using Yarn workspaces, with the main library and an example application in the same repository.
- **Bob:** A build tool used to compile the TypeScript source code into different module formats (CommonJS, ES Modules).

**Architecture:**

The project consists of three main parts:

1.  **JavaScript/TypeScript Layer:** This is the main API that developers interact with. It provides a set of functions and components (e.g., `addPass`, `WalletButton`) that are consistent across both iOS and Android.
2.  **Native iOS Layer:** Written in Objective-C, this layer uses Apple's PassKit framework to handle `.pkpass` files and add them to the Apple Wallet.
3.  **Native Android Layer:** Written in Kotlin, this layer uses the Google Wallet API to handle JWTs and add them to the Google Wallet.

## Building and Running

The following commands are essential for the development workflow:

- **Installation:**

  ```bash
  yarn install
  ```

  This command installs all the dependencies for the library and the example app.

- **Building the Library:**

  ```bash
  yarn prepare
  ```

  This command, which runs `bob build`, compiles the TypeScript code in the `src` directory and outputs the compiled JavaScript code to the `lib` directory.

- **Running the Example App:**
  The `example` directory contains a fully functional React Native application that demonstrates the usage of the library.

  - To run on iOS:
    ```bash
    cd example && yarn ios
    ```
  - To run on Android:
    ```bash
    cd example && yarn android
    ```

- **Testing:**

  ```bash
  yarn test
  ```

  This command runs the Jest test suite for the library.

- **Linting and Formatting:**
  ```bash
  yarn lint
  ```
  This command runs ESLint to check for code quality and style issues. The project also uses Prettier for automatic code formatting.

## Development Conventions

- **Commit Messages:** The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is enforced by `commitlint` and `lefthook`.
- **Branching Strategy:** The main development branch is `main`. Feature branches should be created from `main` and merged back into it via pull requests.
- **Pull Requests:** Pull requests are the primary way to contribute to the project. They should be descriptive and include a clear explanation of the changes.
- **Releasing:** The project uses `release-it` for automated versioning and package publishing. The release process is triggered by a GitHub Actions workflow.
- **Code Style:** The project uses a combination of ESLint and Prettier to enforce a consistent code style. The configuration files for these tools are located in the root of the project.
- **Documentation:** The project uses TSDoc for inline documentation in the source code. This documentation is then used to generate the API reference using `typedoc`.
