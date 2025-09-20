# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0] - 2025-09-20

### Features

- Implement Android support with Google Wallet integration
- Implement official Google Wallet button with proper branding and localization
- Implement Android button styles with iOS parity
- Improve JWT generator and update documentation

### Bug Fixes

- Standardize error handling and event format across platforms
- Improve Android wallet integration and documentation
- Add localization support to example project
- Fix Android build issues
- Generate HTML docs instead of markdown for GitHub Pages
- Resolve all GitHub Actions workflow failures
- Resolve SonarCloud and Security workflow issues

### Documentation

- Consolidate Android testing documentation and refactor example app
- Fix README inaccuracies
- Change downloads badge to show total downloads instead of monthly

### Tests

- Improve test coverage and consolidate test files

### BREAKING CHANGES

- WalletButtonStyle enum values changed to be platform-agnostic

## [0.2.1] - 2024-08-15

### Fixed

- Included PassKit framework in podspec for proper iOS integration

## [0.2.0] - 2024-08-14

### Added

- Initial public release on NPM registry
- iOS implementation with Apple Wallet support
- TypeScript definitions
- Example application

### Changed

- Updated package name to @azizuysal/wallet-kit
- Added public access configuration for NPM

## [0.1.0] - 2024-08-13

### Added

- Initial iOS implementation with PassKit framework
- Basic API for adding passes to Apple Wallet
- Native button component for iOS
- Event handling system
- Error handling with specific error codes

[1.0.0]: https://github.com/azizuysal/wallet-kit/compare/v0.2.1...v1.0.0
[0.2.1]: https://github.com/azizuysal/wallet-kit/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/azizuysal/wallet-kit/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/azizuysal/wallet-kit/releases/tag/v0.1.0
