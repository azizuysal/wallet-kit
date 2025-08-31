# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-rc.1] - 2025-08-31

### Added

- Android support with Google Wallet integration
- Official Google Wallet button with proper branding and localization
- Comprehensive test suite with 90%+ coverage
- Snapshot tests for visual regression testing
- Automated NPM publishing via GitHub Actions
- Release workflows for stable and pre-release versions
- SECURITY.md with vulnerability reporting procedures
- API documentation with TypeDoc
- Coverage enforcement in Jest configuration
- JWT generator script for Android testing
- Google Wallet JWT structure documentation
- Dependency vulnerability scanning workflow
- Coverage and security badges in README
- RELEASING.md documentation for release process
- Improved .gitignore for build artifacts and temporary files

### Changed

- Consolidated test files to match source file structure (2 test files for 2 source files)
- Refactored example app for better demonstration of features
- Consolidated Android testing documentation
- Standardized error handling and event format across platforms

### Fixed

- Android build configuration issues
- TypeScript errors in test files
- Localization support in example project
- Error code consistency between iOS and Android

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

[Unreleased]: https://github.com/azizuysal/wallet-kit/compare/v1.0.0-rc.1...HEAD
[1.0.0-rc.1]: https://github.com/azizuysal/wallet-kit/compare/v0.2.1...v1.0.0-rc.1
[0.2.1]: https://github.com/azizuysal/wallet-kit/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/azizuysal/wallet-kit/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/azizuysal/wallet-kit/releases/tag/v0.1.0
