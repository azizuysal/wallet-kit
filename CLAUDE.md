# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native library that provides a wrapper for Apple and Google wallet pass functionality. Currently, only Apple Wallet (PassKit) is implemented - Android/Google Wallet support is not yet implemented.

## Development Commands

### Building and Testing

```bash
# Install dependencies (uses Yarn workspaces)
yarn install

# Build the library
yarn prepare

# Run type checking
yarn typecheck

# Run linting
yarn lint

# Run tests
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

# Run Android example (Note: wallet functionality not implemented)
yarn android
```

### Release Process

```bash
# Create a new release (handles version bumping, changelog, git tags, and npm publish)
yarn release
```

## Architecture

### Native Module Structure

The library exports a native module interface with platform-specific implementations:

- **Entry Point**: `src/index.tsx` - Exports the `WalletKit` module and `WalletButton` component
- **iOS Implementation**: `ios/WalletKit.mm` - Objective-C++ implementation using PassKit framework
- **Android Implementation**: `android/src/.../WalletKitModule.kt` - Kotlin stub (not implemented)

### Key APIs

```typescript
// Check if device can add passes
WalletKit.canAddPasses(): Promise<boolean>

// Add a single pass
WalletKit.addPass(passData: string): Promise<void>

// Add multiple passes
WalletKit.addPasses(passDataArray: string[]): Promise<void>

// Listen for pass addition completion
const eventEmitter = new NativeEventEmitter(WalletKit);
eventEmitter.addListener('AddPassCompleted', (event) => {
  console.log('Pass added:', event.success);
});
```

### Component Architecture

- **WalletButton**: Platform-specific native button component
  - iOS: Uses `PKAddPassButton` from PassKit
  - Android: Returns null (not implemented)

Platform-specific components use `.ios.ts` and `.android.ts` file extensions for automatic platform selection by React Native's bundler.

## Testing Approach

Tests are minimal currently. When adding tests:

- Place them in `src/__tests__/`
- Mock native modules using `jest.mock('react-native', ...)`
- Test both success and error scenarios
- Ensure platform-specific behavior is tested

## iOS Implementation Details

The iOS implementation uses:

- `PKPass` for pass data handling
- `PKAddPassesViewController` for the UI flow
- A UIViewController category (`UIViewController+WalletKit`) to find the top-most view controller
- Proper error handling with specific error codes for different failure scenarios

## Common Development Tasks

When implementing Android support:

1. Implement methods in `WalletKitModule.kt` following the iOS pattern
2. Update `WalletButton.android.ts` to render the native button
3. Add corresponding native view manager in Android
4. Update tests to cover Android-specific behavior

When adding new functionality:

1. Add TypeScript interface in `src/index.tsx`
2. Implement in native modules (iOS/Android)
3. Add proper error handling with descriptive messages
4. Update the example app to demonstrate usage
5. Add tests for the new functionality
