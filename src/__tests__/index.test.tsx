import { Platform } from 'react-native';
import WalletKit, { createWalletEventEmitter, detectPassType } from '../index';

declare const mockWalletKit: any;
declare const MockEventEmitter: any;
declare const resetMocks: () => void;
declare const createError: (code: string, message: string) => Error;

describe('WalletKit', () => {
  let mockEmitter: any;

  beforeEach(() => {
    resetMocks();
    mockEmitter = new MockEventEmitter();
    jest
      .spyOn(require('react-native'), 'NativeEventEmitter')
      .mockImplementation(() => mockEmitter);
  });

  describe('detectPassType', () => {
    it('should detect valid JWT format', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(detectPassType(jwt)).toBe('jwt');
    });

    it('should detect PKPass format', () => {
      const pkpass = 'UEsDBAoAAAAAAIdO4kbr';
      expect(detectPassType(pkpass)).toBe('pkpass');
    });

    it('should return unknown for invalid format', () => {
      expect(detectPassType('not.a.jwt')).toBe('unknown');
      expect(detectPassType('invalid-data')).toBe('unknown');
    });

    it('should validate all three JWT segments are base64url', () => {
      expect(detectPassType('valid.segments.here')).toBe('unknown');
      expect(detectPassType('a.b.c')).toBe('unknown');

      const validJWT =
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(detectPassType(validJWT)).toBe('jwt');
    });
  });

  describe('canAddPasses', () => {
    it('should return true when device can add passes', async () => {
      mockWalletKit.canAddPasses.mockResolvedValue(true);
      const result = await WalletKit.canAddPasses();
      expect(result).toBe(true);
      expect(mockWalletKit.canAddPasses).toHaveBeenCalled();
    });

    it('should return false when device cannot add passes', async () => {
      mockWalletKit.canAddPasses.mockResolvedValue(false);
      const result = await WalletKit.canAddPasses();
      expect(result).toBe(false);
    });

    it('should handle errors', async () => {
      const error = createError(
        'ERR_WALLET_NOT_AVAILABLE',
        'Wallet not available'
      );
      mockWalletKit.canAddPasses.mockRejectedValue(error);
      await expect(WalletKit.canAddPasses()).rejects.toMatchObject({
        code: 'ERR_WALLET_NOT_AVAILABLE',
      });
    });
  });

  describe('addPass', () => {
    const validPKPass = 'UEsDBAoAAAAAAIdO4kbr';
    const validJWT =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

    it('should add a valid PKPass', async () => {
      mockWalletKit.addPass.mockResolvedValue(undefined);
      await WalletKit.addPass(validPKPass);
      expect(mockWalletKit.addPass).toHaveBeenCalledWith(validPKPass);
    });

    it('should add a valid JWT', async () => {
      mockWalletKit.addPass.mockResolvedValue(undefined);
      await WalletKit.addPass(validJWT);
      expect(mockWalletKit.addPass).toHaveBeenCalledWith(validJWT);
    });

    it('should reject with INVALID_PASS for invalid data', async () => {
      const error = createError('INVALID_PASS', 'Invalid pass data');
      mockWalletKit.addPass.mockRejectedValue(error);
      await expect(WalletKit.addPass('invalid')).rejects.toMatchObject({
        code: 'INVALID_PASS',
      });
    });

    it('should reject when user cancels', async () => {
      const error = createError('ERR_WALLET_CANCELLED', 'User cancelled');
      mockWalletKit.addPass.mockRejectedValue(error);
      await expect(WalletKit.addPass(validPKPass)).rejects.toMatchObject({
        code: 'ERR_WALLET_CANCELLED',
      });
    });

    it('should handle empty string', async () => {
      mockWalletKit.addPass.mockResolvedValue(undefined);
      await WalletKit.addPass('');
      expect(mockWalletKit.addPass).toHaveBeenCalledWith('');
    });

    it('should handle very large pass data', async () => {
      const largeData = 'A'.repeat(10 * 1024 * 1024);
      mockWalletKit.addPass.mockResolvedValue(undefined);
      await WalletKit.addPass(largeData);
      expect(mockWalletKit.addPass).toHaveBeenCalledWith(largeData);
    });
  });

  describe('addPasses', () => {
    const validPasses = [
      'UEsDBAoAAAAAAIdO4kbr',
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    ];

    it('should add multiple passes', async () => {
      mockWalletKit.addPasses.mockResolvedValue(undefined);
      await WalletKit.addPasses(validPasses);
      expect(mockWalletKit.addPasses).toHaveBeenCalledWith(validPasses);
    });

    it('should handle empty array', async () => {
      mockWalletKit.addPasses.mockResolvedValue(undefined);
      await WalletKit.addPasses([]);
      expect(mockWalletKit.addPasses).toHaveBeenCalledWith([]);
    });

    it('should handle single pass in array', async () => {
      mockWalletKit.addPasses.mockResolvedValue(undefined);
      await WalletKit.addPasses([validPasses[0]!]);
      expect(mockWalletKit.addPasses).toHaveBeenCalledWith([validPasses[0]]);
    });

    it('should handle mixed valid and invalid passes', async () => {
      mockWalletKit.addPasses.mockResolvedValue(undefined);
      const mixedPasses = [validPasses[0]!, 'invalid-pass', validPasses[1]!];
      await WalletKit.addPasses(mixedPasses);
      expect(mockWalletKit.addPasses).toHaveBeenCalledWith(mixedPasses);
    });

    it('should reject with error code', async () => {
      const error = createError('ERR_WALLET_CANCELLED', 'User cancelled');
      mockWalletKit.addPasses.mockRejectedValue(error);
      await expect(WalletKit.addPasses(validPasses)).rejects.toMatchObject({
        code: 'ERR_WALLET_CANCELLED',
      });
    });

    it('should handle array with 100+ passes', async () => {
      const manyPasses = Array(100).fill('UEsDBAoAAAAAAIdO4kbr');
      mockWalletKit.addPasses.mockResolvedValue(undefined);
      await WalletKit.addPasses(manyPasses);
      expect(mockWalletKit.addPasses).toHaveBeenCalledWith(manyPasses);
    });
  });

  describe('Event Emitter', () => {
    it('should create event emitter instance', () => {
      const emitter = createWalletEventEmitter();
      expect(emitter).toBeDefined();
      expect(emitter.addListener).toBeDefined();
      expect(emitter.removeAllListeners).toBeDefined();
    });

    it('should handle AddPassCompleted event', () => {
      const callback = jest.fn();
      const emitter = createWalletEventEmitter();

      const subscription = emitter.addListener('AddPassCompleted', callback);
      mockEmitter.emit('AddPassCompleted', true);

      expect(callback).toHaveBeenCalledWith(true);
      subscription.remove();
    });

    it('should handle multiple listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const emitter = createWalletEventEmitter();

      emitter.addListener('AddPassCompleted', callback1);
      emitter.addListener('AddPassCompleted', callback2);

      mockEmitter.emit('AddPassCompleted', false);

      expect(callback1).toHaveBeenCalledWith(false);
      expect(callback2).toHaveBeenCalledWith(false);
    });

    it('should remove specific listener', () => {
      const callback = jest.fn();
      const emitter = createWalletEventEmitter();

      const subscription = emitter.addListener('AddPassCompleted', callback);
      subscription.remove();

      mockEmitter.emit('AddPassCompleted', true);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not receive events after unsubscribing', () => {
      const callback = jest.fn();
      const emitter = createWalletEventEmitter();

      const subscription = emitter.addListener('AddPassCompleted', callback);
      mockEmitter.emit('AddPassCompleted', true);
      expect(callback).toHaveBeenCalledWith(true);

      subscription.remove();
      mockEmitter.emit('AddPassCompleted', false);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Flows', () => {
    it('should complete full pass addition flow with success event', async () => {
      Platform.OS = 'ios';
      const pkpassData = 'UEsDBAoAAAAAAIdO4kbr';

      mockWalletKit.canAddPasses.mockResolvedValue(true);
      mockWalletKit.addPass.mockResolvedValue(undefined);

      const eventCallback = jest.fn();
      const emitter = createWalletEventEmitter();
      emitter.addListener('AddPassCompleted', eventCallback);

      const canAdd = await WalletKit.canAddPasses();
      expect(canAdd).toBe(true);

      const passType = detectPassType(pkpassData);
      expect(passType).toBe('pkpass');

      await WalletKit.addPass(pkpassData);
      expect(mockWalletKit.addPass).toHaveBeenCalledWith(pkpassData);

      mockEmitter.emit('AddPassCompleted', true);
      expect(eventCallback).toHaveBeenCalledWith(true);
    });

    it('should handle error recovery with retry', async () => {
      const passData = 'UEsDBAoAAAAAAIdO4kbr';
      const error = createError('ERR_WALLET_UNKNOWN', 'Unknown error');

      mockWalletKit.addPass
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      await expect(WalletKit.addPass(passData)).rejects.toMatchObject({
        code: 'ERR_WALLET_UNKNOWN',
      });

      await expect(WalletKit.addPass(passData)).resolves.toBeUndefined();
      expect(mockWalletKit.addPass).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent pass additions', async () => {
      mockWalletKit.addPass.mockResolvedValue(undefined);

      const passes = ['pass1', 'pass2', 'pass3'];
      const promises = passes.map((pass) => WalletKit.addPass(pass));

      await Promise.all(promises);

      expect(mockWalletKit.addPass).toHaveBeenCalledTimes(3);
      passes.forEach((pass) => {
        expect(mockWalletKit.addPass).toHaveBeenCalledWith(pass);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = createError('ERR_WALLET_UNKNOWN', 'Request timeout');
      mockWalletKit.addPass.mockRejectedValue(timeoutError);

      await expect(WalletKit.addPass('data')).rejects.toMatchObject({
        code: 'ERR_WALLET_UNKNOWN',
        message: 'Request timeout',
      });
    });

    it('should handle rapid sequential calls', async () => {
      mockWalletKit.canAddPasses.mockResolvedValue(true);

      const promises = Array(10)
        .fill(null)
        .map(() => WalletKit.canAddPasses());

      const results = await Promise.all(promises);
      expect(results.every((r) => r === true)).toBe(true);
      expect(mockWalletKit.canAddPasses).toHaveBeenCalledTimes(10);
    });

    it('should handle malformed pass data gracefully', async () => {
      const malformedData = [null, undefined, 123, {}, [], true, false];

      for (const data of malformedData) {
        mockWalletKit.addPass.mockResolvedValue(undefined);
        await WalletKit.addPass(data as any);
        expect(mockWalletKit.addPass).toHaveBeenCalledWith(data);
      }
    });

    it('should handle platform-specific errors', async () => {
      Platform.OS = 'android';
      const activityError = createError(
        'ERR_WALLET_ACTIVITY_NULL',
        'Activity destroyed'
      );

      mockWalletKit.addPass
        .mockRejectedValueOnce(activityError)
        .mockRejectedValueOnce(activityError)
        .mockResolvedValueOnce(undefined);

      await expect(WalletKit.addPass('jwt')).rejects.toMatchObject({
        code: 'ERR_WALLET_ACTIVITY_NULL',
      });
      await expect(WalletKit.addPass('jwt')).rejects.toMatchObject({
        code: 'ERR_WALLET_ACTIVITY_NULL',
      });

      await expect(WalletKit.addPass('jwt')).resolves.toBeUndefined();
    });

    it('should handle listener errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalCallback = jest.fn();
      const emitter = createWalletEventEmitter();

      emitter.addListener('AddPassCompleted', errorCallback);
      emitter.addListener('AddPassCompleted', normalCallback);

      expect(() => mockEmitter.emit('AddPassCompleted', true)).toThrow(
        'Listener error'
      );
      expect(errorCallback).toHaveBeenCalled();
    });

    it('should handle double listener removal', () => {
      const emitter = createWalletEventEmitter();
      const subscription = emitter.addListener('AddPassCompleted', () => {});

      subscription.remove();
      expect(() => subscription.remove()).not.toThrow();
    });
  });
});
