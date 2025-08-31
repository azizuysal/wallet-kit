// Global test utilities type declarations
// These are made available by jest.setup.js

declare global {
  // Mock for the WalletKit native module
  const mockWalletKit: {
    canAddPasses: jest.Mock;
    addPass: jest.Mock;
    addPasses: jest.Mock;
    addListener: jest.Mock;
    removeListeners: jest.Mock;
  };

  // Mock EventEmitter class for testing
  class MockEventEmitter {
    constructor();
    addListener(eventName: string, callback: Function): { remove: () => void };
    removeAllListeners(eventName?: string): void;
    emit(eventName: string, data: any): void;
    listenerCount(eventName: string): number;
  }

  // Helper to reset all mocks between tests
  function resetMocks(): void;

  // Helper to create an error with a specific code
  function createError(code: string, message: string): Error & { code: string };
}

export {};
