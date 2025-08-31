/* global jest */
const mockWalletKit = {
  canAddPasses: jest.fn(),
  addPass: jest.fn(),
  addPasses: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

class MockEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  addListener(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return {
      remove: () => {
        const listenersSet = this.listeners.get(eventName);
        if (listenersSet) {
          listenersSet.delete(callback);
        }
      },
    };
  }

  removeAllListeners(eventName) {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  emit(eventName, data) {
    const listenersSet = this.listeners.get(eventName);
    if (listenersSet) {
      listenersSet.forEach((callback) => callback(data));
    }
  }

  listenerCount(eventName) {
    const listenersSet = this.listeners.get(eventName);
    return listenersSet ? listenersSet.size : 0;
  }
}

const resetMocks = () => {
  mockWalletKit.canAddPasses.mockReset();
  mockWalletKit.addPass.mockReset();
  mockWalletKit.addPasses.mockReset();
  mockWalletKit.addListener.mockReset();
  mockWalletKit.removeListeners.mockReset();
};

const createError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
  NativeModules: {
    WalletKit: mockWalletKit,
  },
  NativeEventEmitter: jest.fn(() => new MockEventEmitter()),
  requireNativeComponent: jest.fn((name) => name),
  View: 'View',
}));

// Make utilities globally available to all tests
global.mockWalletKit = mockWalletKit;
global.MockEventEmitter = MockEventEmitter;
global.resetMocks = resetMocks;
global.createError = createError;
