import { Platform } from 'react-native';
import WalletKit, { createWalletEventEmitter, detectPassType } from '../index';

declare const mockWalletKit: {
  canAddPasses: jest.Mock;
  addPass: jest.Mock;
  addPasses: jest.Mock;
  addListener: jest.Mock;
  removeListeners: jest.Mock;
};
declare const MockEventEmitter: new () => {
  addListener: (
    eventName: string,
    callback: (value: unknown) => void
  ) => { remove: () => void };
  removeAllListeners: (eventName?: string) => void;
  emit: (eventName: string, data: unknown) => void;
  listenerCount: (eventName: string) => number;
};
declare const resetMocks: () => void;
declare const createError: (code: string, message: string) => Error;

const validPkpass = 'UEsDBAoAAAAAAIdO4kbr';
const validJwt =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

describe('WalletKit', () => {
  let mockEmitter: InstanceType<typeof MockEventEmitter>;
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    resetMocks();
    mockEmitter = new MockEventEmitter();
    jest
      .spyOn(require('react-native'), 'NativeEventEmitter')
      .mockImplementation(() => mockEmitter);
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  describe('detectPassType', () => {
    it('detects a valid JWT', () => {
      expect(detectPassType(validJwt)).toBe('jwt');
    });

    it('detects a base64-encoded pkpass prefix', () => {
      expect(detectPassType(validPkpass)).toBe('pkpass');
    });

    it('returns unknown for malformed input', () => {
      expect(detectPassType('not.a.jwt')).toBe('unknown');
      expect(detectPassType('a.b.c')).toBe('unknown');
      expect(detectPassType('invalid-data')).toBe('unknown');
    });

    it('returns unknown for empty or non-string input', () => {
      expect(detectPassType('')).toBe('unknown');
      expect(detectPassType(undefined as unknown as string)).toBe('unknown');
      expect(detectPassType(null as unknown as string)).toBe('unknown');
      expect(detectPassType(42 as unknown as string)).toBe('unknown');
    });

    it('requires all three JWT segments to be valid base64url', () => {
      expect(detectPassType('eyJhbGciOiJIUzI1NiJ9.!.abc')).toBe('unknown');
    });

    it('tolerates line-wrapped base64 on pkpass input (parity with iOS native)', () => {
      const wrapped = 'UEs DBA oA\nAAA AAI\tdO4 kbr';
      expect(detectPassType(wrapped)).toBe('pkpass');
    });

    it('tolerates surrounding whitespace on JWT input (parity with Android native trim)', () => {
      const padded = `  ${validJwt}\n`;
      expect(detectPassType(padded)).toBe('jwt');
    });

    it('rejects arbitrary base64 that merely contains the bytes "PK" somewhere', () => {
      // "ABCDPKXY" — decoded bytes do NOT start with the ZIP signature.
      // The previous "decoded.includes('PK')" heuristic would have matched
      // on the embedded 'PK' and falsely returned 'pkpass'.
      const falsePositive = Buffer.from('ABCDPKXY').toString('base64');
      expect(detectPassType(falsePositive)).toBe('unknown');
    });

    it('recognizes the end-of-central-directory ZIP signature (empty archive)', () => {
      const bytes = Buffer.from([0x50, 0x4b, 0x05, 0x06, 0x00, 0x00]);
      expect(detectPassType(bytes.toString('base64'))).toBe('pkpass');
    });

    it('recognizes the spanned archive ZIP signature', () => {
      const bytes = Buffer.from([0x50, 0x4b, 0x07, 0x08, 0x00, 0x00]);
      expect(detectPassType(bytes.toString('base64'))).toBe('pkpass');
    });
  });

  describe('canAddPasses', () => {
    it('resolves with true when the device can add passes', async () => {
      mockWalletKit.canAddPasses.mockResolvedValue(true);
      await expect(WalletKit.canAddPasses()).resolves.toBe(true);
      expect(mockWalletKit.canAddPasses).toHaveBeenCalledTimes(1);
    });

    it('resolves with false when the device cannot add passes', async () => {
      mockWalletKit.canAddPasses.mockResolvedValue(false);
      await expect(WalletKit.canAddPasses()).resolves.toBe(false);
    });

    it('propagates errors from the native layer without swallowing', async () => {
      mockWalletKit.canAddPasses.mockRejectedValue(
        createError('ERR_WALLET_NOT_AVAILABLE', 'Play Services missing')
      );
      await expect(WalletKit.canAddPasses()).rejects.toMatchObject({
        code: 'ERR_WALLET_NOT_AVAILABLE',
        message: 'Play Services missing',
      });
    });
  });

  describe('addPass', () => {
    it('forwards a valid pkpass string to the native layer and resolves with the outcome', async () => {
      mockWalletKit.addPass.mockResolvedValue(true);
      await expect(WalletKit.addPass(validPkpass)).resolves.toBe(true);
      expect(mockWalletKit.addPass).toHaveBeenCalledWith(validPkpass);
    });

    it('forwards a valid JWT string to the native layer and resolves with the outcome', async () => {
      mockWalletKit.addPass.mockResolvedValue(true);
      await expect(WalletKit.addPass(validJwt)).resolves.toBe(true);
      expect(mockWalletKit.addPass).toHaveBeenCalledWith(validJwt);
    });

    it('resolves with false when the user cancels the add flow', async () => {
      mockWalletKit.addPass.mockResolvedValue(false);
      await expect(WalletKit.addPass(validPkpass)).resolves.toBe(false);
    });

    it('rejects empty strings with INVALID_PASS before touching native', async () => {
      await expect(WalletKit.addPass('')).rejects.toMatchObject({
        code: 'INVALID_PASS',
      });
      expect(mockWalletKit.addPass).not.toHaveBeenCalled();
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['number', 42],
      ['object', {}],
      ['array', []],
      ['boolean', true],
    ])(
      'rejects non-string input (%s) with INVALID_PASS without calling native',
      async (_label, value) => {
        await expect(
          WalletKit.addPass(value as unknown as string)
        ).rejects.toMatchObject({ code: 'INVALID_PASS' });
        expect(mockWalletKit.addPass).not.toHaveBeenCalled();
      }
    );

    it('rejects unrecognized pass formats with INVALID_PASS without calling native', async () => {
      await expect(
        WalletKit.addPass('not a wallet pass at all')
      ).rejects.toMatchObject({ code: 'INVALID_PASS' });
      expect(mockWalletKit.addPass).not.toHaveBeenCalled();
    });

    it('propagates native UNSUPPORTED_VERSION', async () => {
      mockWalletKit.addPass.mockRejectedValue(
        createError('UNSUPPORTED_VERSION', 'Pass version not supported')
      );
      await expect(WalletKit.addPass(validPkpass)).rejects.toMatchObject({
        code: 'UNSUPPORTED_VERSION',
      });
    });

    it('propagates native ERR_WALLET_IN_PROGRESS', async () => {
      mockWalletKit.addPass.mockRejectedValue(
        createError(
          'ERR_WALLET_IN_PROGRESS',
          'Another add-pass call is already in flight'
        )
      );
      await expect(WalletKit.addPass(validPkpass)).rejects.toMatchObject({
        code: 'ERR_WALLET_IN_PROGRESS',
      });
    });
  });

  describe('addPasses', () => {
    it('forwards a single-pass array to the native layer on iOS and resolves with the outcome', async () => {
      Platform.OS = 'ios';
      mockWalletKit.addPasses.mockResolvedValue(true);
      await expect(WalletKit.addPasses([validPkpass])).resolves.toBe(true);
      expect(mockWalletKit.addPasses).toHaveBeenCalledWith([validPkpass]);
    });

    it('forwards multiple passes to the native layer on iOS and resolves with the outcome', async () => {
      Platform.OS = 'ios';
      mockWalletKit.addPasses.mockResolvedValue(true);
      await expect(
        WalletKit.addPasses([validPkpass, validPkpass, validPkpass])
      ).resolves.toBe(true);
      expect(mockWalletKit.addPasses).toHaveBeenCalledWith([
        validPkpass,
        validPkpass,
        validPkpass,
      ]);
    });

    it('forwards a single-JWT array on Android and resolves with the outcome', async () => {
      Platform.OS = 'android';
      mockWalletKit.addPasses.mockResolvedValue(true);
      await expect(WalletKit.addPasses([validJwt])).resolves.toBe(true);
      expect(mockWalletKit.addPasses).toHaveBeenCalledWith([validJwt]);
    });

    it('resolves with false on iOS when user cancels with multiple passes queued', async () => {
      Platform.OS = 'ios';
      mockWalletKit.addPasses.mockResolvedValue(false);
      await expect(
        WalletKit.addPasses([validPkpass, validPkpass])
      ).resolves.toBe(false);
    });

    it('rejects multi-JWT calls on Android with ERR_WALLET_MULTIPLE_NOT_SUPPORTED and never hits native', async () => {
      Platform.OS = 'android';
      await expect(
        WalletKit.addPasses([validJwt, validJwt])
      ).rejects.toMatchObject({
        code: 'ERR_WALLET_MULTIPLE_NOT_SUPPORTED',
      });
      expect(mockWalletKit.addPasses).not.toHaveBeenCalled();
    });

    it('rejects an empty array with INVALID_PASS without calling native', async () => {
      await expect(WalletKit.addPasses([])).rejects.toMatchObject({
        code: 'INVALID_PASS',
      });
      expect(mockWalletKit.addPasses).not.toHaveBeenCalled();
    });

    it('rejects a non-array argument with INVALID_PASS without calling native', async () => {
      await expect(
        WalletKit.addPasses(null as unknown as string[])
      ).rejects.toMatchObject({ code: 'INVALID_PASS' });
      await expect(
        WalletKit.addPasses('pkpass' as unknown as string[])
      ).rejects.toMatchObject({ code: 'INVALID_PASS' });
      expect(mockWalletKit.addPasses).not.toHaveBeenCalled();
    });

    it('rejects if any entry is not a recognized pass format', async () => {
      Platform.OS = 'ios';
      await expect(
        WalletKit.addPasses([validPkpass, 'garbage', validPkpass])
      ).rejects.toMatchObject({ code: 'INVALID_PASS' });
      expect(mockWalletKit.addPasses).not.toHaveBeenCalled();
    });

    it('propagates native errors when input is valid', async () => {
      Platform.OS = 'ios';
      mockWalletKit.addPasses.mockRejectedValue(
        createError('ERR_WALLET_NOT_AVAILABLE', 'Wallet not available')
      );
      await expect(
        WalletKit.addPasses([validPkpass, validPkpass])
      ).rejects.toMatchObject({ code: 'ERR_WALLET_NOT_AVAILABLE' });
    });
  });

  describe('Event emitter', () => {
    it('returns a usable NativeEventEmitter instance', () => {
      const emitter = createWalletEventEmitter();
      expect(emitter).toBeDefined();
      expect(typeof emitter.addListener).toBe('function');
      expect(typeof emitter.removeAllListeners).toBe('function');
    });

    it('delivers AddPassCompleted payload as a raw boolean (documented contract)', () => {
      const callback = jest.fn();
      const emitter = createWalletEventEmitter();
      emitter.addListener('AddPassCompleted', callback);

      mockEmitter.emit('AddPassCompleted', true);
      mockEmitter.emit('AddPassCompleted', false);

      expect(callback).toHaveBeenNthCalledWith(1, true);
      expect(callback).toHaveBeenNthCalledWith(2, false);
    });

    it('supports multiple listeners receiving the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const emitter = createWalletEventEmitter();

      emitter.addListener('AddPassCompleted', callback1);
      emitter.addListener('AddPassCompleted', callback2);

      mockEmitter.emit('AddPassCompleted', false);

      expect(callback1).toHaveBeenCalledWith(false);
      expect(callback2).toHaveBeenCalledWith(false);
    });

    it('stops delivering to a listener once its subscription is removed', () => {
      const callback = jest.fn();
      const emitter = createWalletEventEmitter();
      const subscription = emitter.addListener('AddPassCompleted', callback);

      subscription.remove();
      mockEmitter.emit('AddPassCompleted', true);

      expect(callback).not.toHaveBeenCalled();
    });

    it('tolerates double removal of a subscription', () => {
      const emitter = createWalletEventEmitter();
      const subscription = emitter.addListener('AddPassCompleted', jest.fn());
      subscription.remove();
      expect(() => subscription.remove()).not.toThrow();
    });
  });

  describe('Integration flow', () => {
    it('completes the canAdd → addPass sequence with a boolean outcome, and the event emitter still fires as secondary channel', async () => {
      Platform.OS = 'ios';
      mockWalletKit.canAddPasses.mockResolvedValue(true);
      mockWalletKit.addPass.mockResolvedValue(true);

      const completion = jest.fn();
      const emitter = createWalletEventEmitter();
      emitter.addListener('AddPassCompleted', completion);

      await expect(WalletKit.canAddPasses()).resolves.toBe(true);
      await expect(WalletKit.addPass(validPkpass)).resolves.toBe(true);

      mockEmitter.emit('AddPassCompleted', true);
      expect(completion).toHaveBeenCalledWith(true);
    });

    it('recovers from a native error on a subsequent retry', async () => {
      mockWalletKit.addPass
        .mockRejectedValueOnce(
          createError('ERR_WALLET_UNKNOWN', 'Transient error')
        )
        .mockResolvedValueOnce(true);

      await expect(WalletKit.addPass(validPkpass)).rejects.toMatchObject({
        code: 'ERR_WALLET_UNKNOWN',
      });
      await expect(WalletKit.addPass(validPkpass)).resolves.toBe(true);
      expect(mockWalletKit.addPass).toHaveBeenCalledTimes(2);
    });
  });
});
