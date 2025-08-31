# WalletButton Component Test Suite

This directory contains a comprehensive test suite for the WalletButton component that goes far beyond basic snapshot testing. The test suite is designed to test real functionality, edge cases, and production scenarios.

## Test Files Overview

### 1. `WalletButton.test.tsx` (Core Tests)
The main test file containing fundamental functionality tests:
- **Basic Rendering**: Component instantiation, prop passing, and ViewProps inheritance
- **Style Mapping**: Cross-platform style mapping (iOS/Android/unsupported platforms)  
- **Event Handling**: onPress callbacks and edge cases
- **Edge Cases**: Null/undefined props, invalid enum values
- **TypeScript Integration**: Type safety and prop validation
- **Platform Consistency**: Cross-platform behavior validation

**Total Tests**: 26

### 2. `WalletButton.functional.test.tsx` (Functional Tests)
Focused on testing the component's real-world functionality:
- **Core Functionality**: Component lifecycle and state management
- **Style Logic**: Platform-specific style mapping logic
- **Error Handling**: Runtime error scenarios and recovery
- **Performance**: Memory management and high-load scenarios
- **Accessibility**: Screen reader and accessibility tool integration
- **Real-world Usage**: Practical usage patterns and integration scenarios

**Total Tests**: 34

### 3. `WalletButton.advanced.test.tsx` (Advanced Scenarios)
Demonstrates advanced testing strategies for React Native components:
- **Native Bridge Integration**: Connection to native components
- **Platform-Specific Logic**: iOS PKAddPassButton vs Android Google Wallet mapping
- **Runtime Error Scenarios**: Corruption, platform switching, malformed data
- **Lifecycle Management**: Memory leaks, concurrent instances
- **Production Scenarios**: Real app usage patterns
- **Cross-Platform Consistency**: API consistency across platforms
- **Performance Testing**: High-frequency updates, optimization scenarios

**Total Tests**: 18

## Key Testing Approaches Demonstrated

### 1. Testing Native Component Integration
- **Challenge**: Testing components that use `requireNativeComponent`
- **Solution**: Mock the native component while testing the bridge interface
- **Benefits**: Validates that props are correctly passed to native side

### 2. Platform-Specific Style Mapping
- **Challenge**: Testing cross-platform style enum to numeric mapping
- **Solution**: Test each platform individually with proper mocking
- **Coverage**: iOS (PKAddPassButtonStyle), Android (Google Wallet themes), unsupported platforms

### 3. Edge Case and Error Handling
- **Challenge**: Ensuring robustness in production environments
- **Solution**: Test malformed inputs, platform corruption, rapid state changes
- **Benefits**: Prevents crashes and improves user experience

### 4. Performance and Memory Management
- **Challenge**: Avoiding memory leaks in React Native apps
- **Solution**: Test rapid mount/unmount cycles, concurrent instances
- **Benefits**: Ensures scalability in production apps

### 5. Accessibility Testing
- **Challenge**: Ensuring compatibility with screen readers and accessibility tools
- **Solution**: Test all accessibility props and state changes
- **Benefits**: Better user experience for users with disabilities

## Testing Strategies Beyond Snapshots

### Why Not Just Snapshots?
Snapshot tests only catch visual regressions but miss:
- Logic errors in style mapping
- Runtime errors with invalid inputs
- Memory leaks and performance issues  
- Platform-specific behavior differences
- Accessibility problems
- Integration issues with native modules

### Real Functionality Testing
Our tests focus on:
1. **Business Logic**: Style mapping algorithms work correctly
2. **Error Resilience**: Component handles edge cases gracefully
3. **Platform Behavior**: Consistent API across iOS/Android
4. **Performance**: No memory leaks or performance degradation
5. **Integration**: Proper interaction with native modules
6. **Accessibility**: Screen reader and accessibility tool compatibility

## Mock Strategy

### Global Jest Setup (`jest.setup.js`)
- Provides consistent React Native mocks across all tests
- Mocks native modules (`WalletKit`, `NativeEventEmitter`)
- Avoids complex per-test mocking that can cause conflicts

### Test-Specific Mocks
- Platform.OS switching for cross-platform testing
- Event emitter simulation for native events
- Error simulation for robustness testing

## Running the Tests

```bash
# Run all WalletButton tests
yarn test --testNamePattern="WalletButton"

# Run specific test file
yarn test src/__tests__/WalletButton.test.tsx
yarn test src/__tests__/WalletButton.functional.test.tsx
yarn test src/__tests__/WalletButton.advanced.test.tsx

# Run with coverage
yarn test --coverage --testNamePattern="WalletButton"

# Run with verbose output
yarn test --testNamePattern="WalletButton" --verbose
```

## Test Coverage Areas

### ✅ Covered
- Component rendering and prop passing
- Cross-platform style mapping logic
- Event handling and callbacks
- Edge cases and error scenarios
- Platform switching and unsupported platforms
- TypeScript integration and type safety
- Memory management and performance
- Accessibility features
- Real-world usage patterns

### 🚧 Could Be Enhanced
- Integration with actual native modules (requires native test environment)
- Visual regression testing (would require snapshot testing or visual diff tools)
- Performance benchmarking (would require performance testing tools)
- End-to-end testing in actual React Native apps

## Best Practices Demonstrated

1. **Test Real Functionality**: Focus on behavior, not implementation details
2. **Handle Edge Cases**: Test with malformed, null, undefined inputs
3. **Cross-Platform Testing**: Ensure consistent behavior across platforms
4. **Error Resilience**: Test error scenarios and recovery
5. **Performance Awareness**: Test for memory leaks and performance issues
6. **Accessibility First**: Test with screen readers and accessibility tools in mind
7. **TypeScript Integration**: Validate type safety and prop interfaces
8. **Mock Strategy**: Use consistent, minimal mocks that don't interfere with testing

## Conclusion

This test suite demonstrates how to create comprehensive tests for React Native components that use native modules. Rather than relying solely on snapshots, we test the actual functionality, edge cases, and production scenarios that users will encounter.

The tests serve as both validation of the component's behavior and documentation of its expected functionality, making them valuable for both current development and future maintenance.