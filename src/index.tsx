import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { WalletButton } from './WalletButton';
import { WalletButtonStyle } from './WalletButton.types';

const LINKING_ERROR =
  `The package '@azizuysal/wallet-kit' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const WalletKit = NativeModules.WalletKit
  ? NativeModules.WalletKit
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * Error codes that can be returned by wallet operations.
 *
 * @remarks
 * - `INVALID_PASS` - The pass data is missing, empty, or not in a recognized
 *   wallet pass format (neither a base64-encoded .pkpass nor a JWT).
 * - `UNSUPPORTED_VERSION` - The pass version is not supported (iOS only).
 * - `ERR_WALLET_NOT_AVAILABLE` - Wallet app is not available on the device.
 * - `ERR_WALLET_ACTIVITY_NULL` - Android-specific: Activity context is null.
 * - `ERR_WALLET_MULTIPLE_NOT_SUPPORTED` - Android-specific: the Google Wallet
 *   API only accepts a single JWT per call. Combine multiple passes into one
 *   JWT on your server before calling {@link addPasses}.
 * - `ERR_WALLET_IN_PROGRESS` - A previous add-pass call is still awaiting a
 *   result. Wait for it to resolve or reject before issuing another.
 * - `ERR_WALLET_UNKNOWN` - An unexpected error occurred.
 *
 * @remarks
 * User cancellation is **not** reported as a rejection on either platform.
 * The add-pass promise resolves with `false` when the user cancels; the
 * same outcome is also emitted via the `AddPassCompleted` event for
 * consumers who prefer the event API — see {@link createWalletEventEmitter}.
 */
export type WalletErrorCode =
  | 'INVALID_PASS'
  | 'UNSUPPORTED_VERSION'
  | 'ERR_WALLET_NOT_AVAILABLE'
  | 'ERR_WALLET_ACTIVITY_NULL'
  | 'ERR_WALLET_MULTIPLE_NOT_SUPPORTED'
  | 'ERR_WALLET_IN_PROGRESS'
  | 'ERR_WALLET_UNKNOWN';

/**
 * Error shape rejected by WalletKit promises. The native side sets `code` and
 * `message`; JS-layer validation produces errors with the same shape so
 * consumers handle both sources identically.
 */
export interface WalletError extends Error {
  code: WalletErrorCode;
}

const walletError = (code: WalletErrorCode, message: string): WalletError => {
  const error = new Error(message) as WalletError;
  error.code = code;
  return error;
};

interface NativeWalletModule {
  canAddPasses(): Promise<boolean>;
  addPass(passData: string): Promise<boolean>;
  addPasses(passDataArray: string[]): Promise<boolean>;
}

const nativeModule = WalletKit as NativeWalletModule;

/**
 * Utility function to check if a string is valid base64url and can be decoded.
 * Base64url uses URL and filename-safe alphabet: A-Z, a-z, 0-9, -, _.
 *
 * @internal
 */
const isValidBase64Url = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }

  if (str.length < 4) {
    return false;
  }

  const base64urlRegex = /^[A-Za-z0-9_-]+$/;

  if (!base64urlRegex.test(str)) {
    return false;
  }

  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    atob(base64);
    return true;
  } catch {
    return false;
  }
};

/**
 * Detects the type of pass data based on its format.
 *
 * @param passData - The pass data string to analyze.
 * @returns `'pkpass'` for Apple Wallet passes (base64-encoded .pkpass),
 *          `'jwt'` for Google Wallet passes (JWT tokens), or `'unknown'`
 *          if the format cannot be determined.
 *
 * @example
 * ```typescript
 * const passType = detectPassType(passData);
 * if (passType === 'jwt') {
 *   // Google Wallet pass
 * } else if (passType === 'pkpass') {
 *   // Apple Wallet pass
 * }
 * ```
 */
// `.pkpass` files are ZIP archives. Valid ZIP local-file-header signatures:
// - `PK\x03\x04` (local file header, standard case)
// - `PK\x05\x06` (end-of-central-directory, for an empty archive)
// - `PK\x07\x08` (spanned archive marker)
const PKPASS_ZIP_SIGNATURES: readonly string[] = [
  String.fromCharCode(0x50, 0x4b, 0x03, 0x04),
  String.fromCharCode(0x50, 0x4b, 0x05, 0x06),
  String.fromCharCode(0x50, 0x4b, 0x07, 0x08),
];

export const detectPassType = (
  passData: string
): 'pkpass' | 'jwt' | 'unknown' => {
  if (typeof passData !== 'string' || passData.length === 0) {
    return 'unknown';
  }

  // Trim leading/trailing whitespace so JWTs with surrounding whitespace are
  // recognised here. Android native calls `passData.trim()` before passing
  // the JWT to Google Wallet, and iOS native tolerates embedded whitespace
  // via NSDataBase64DecodingIgnoreUnknownCharacters; matching that tolerance
  // keeps the JS validator from rejecting inputs the native layer accepts.
  const trimmed = passData.trim();
  if (trimmed.length === 0) {
    return 'unknown';
  }

  if (trimmed.includes('.')) {
    const segments = trimmed.split('.');
    if (
      segments.length === 3 &&
      segments.every((segment) => isValidBase64Url(segment))
    ) {
      return 'jwt';
    }
  }

  // Strip all whitespace (including interior newlines) — iOS native uses
  // NSDataBase64DecodingIgnoreUnknownCharacters, which tolerates line-wrapped
  // base64 that is common in server-generated payloads. Matching that
  // tolerance keeps the JS validator from rejecting inputs the native layer
  // would accept. `trimmed` above handled surrounding whitespace for the
  // JWT check; here we also drop interior whitespace before base64 decoding.
  const sanitized = trimmed.replace(/\s+/g, '');
  // 8 base64 characters (a full two-block chunk, no padding needed) decode
  // to 6 bytes — enough for the 4-byte ZIP signature. Anything shorter
  // cannot hold a valid signature.
  if (sanitized.length < 8) {
    return 'unknown';
  }

  try {
    const decoded = atob(sanitized.substring(0, 8));
    if (PKPASS_ZIP_SIGNATURES.some((sig) => decoded.startsWith(sig))) {
      return 'pkpass';
    }
  } catch {
    // Fall through to unknown.
  }

  return 'unknown';
};

const validatePassInput = (passData: unknown): void => {
  if (typeof passData !== 'string' || passData.length === 0) {
    throw walletError(
      'INVALID_PASS',
      'Pass data must be a non-empty string (base64-encoded .pkpass for iOS, JWT for Android).'
    );
  }

  if (detectPassType(passData) === 'unknown') {
    throw walletError(
      'INVALID_PASS',
      'Pass data does not match a recognized wallet pass format (base64-encoded .pkpass or JWT).'
    );
  }
};

/**
 * WalletKit public API. All methods validate input at the JS layer before
 * delegating to the native module, so invalid calls fail fast with a stable
 * error shape on every platform.
 */
export const WalletKitModule = {
  /**
   * Check if the device can add passes to the wallet.
   *
   * @returns `true` if the device supports adding passes, `false` otherwise.
   * Rejects if the availability check itself fails (e.g. Google Play Services
   * error on Android).
   */
  canAddPasses(): Promise<boolean> {
    return nativeModule.canAddPasses();
  },

  /**
   * Add a single pass to the wallet.
   *
   * @param passData - Base64-encoded .pkpass on iOS, JWT on Android.
   * @returns A promise that resolves with `true` when the pass was newly
   *          added in this session, or `false` when the user cancelled or
   *          the pass was already in the wallet. Rejects with a
   *          {@link WalletError} on any error.
   * @throws {@link WalletError} with code `INVALID_PASS` if `passData` is
   *         empty or not a recognized format.
   * @throws {@link WalletError} with code `ERR_WALLET_IN_PROGRESS` if a
   *         previous add-pass call is still awaiting a result.
   *
   * @remarks
   * The same outcome is also delivered via the `AddPassCompleted` event on
   * {@link createWalletEventEmitter}. The event is retained as a secondary
   * notification channel for multi-listener setups; the Promise return
   * value is the primary API in 2.x.
   */
  addPass(passData: string): Promise<boolean> {
    try {
      validatePassInput(passData);
    } catch (error) {
      return Promise.reject(error);
    }
    return nativeModule.addPass(passData);
  },

  /**
   * Add one or more passes to the wallet.
   *
   * @param passDataArray - Non-empty array of pass data strings (base64 for
   *                        iOS, JWT for Android).
   * @returns A promise that resolves with `true` when every pass was newly
   *          added in this session, or `false` when the user cancelled or
   *          any pass was already in the wallet. Rejects with a
   *          {@link WalletError} on any error.
   *
   * @throws {@link WalletError} with code `INVALID_PASS` if the array is empty
   *         or contains an entry that is not a recognized format.
   * @throws {@link WalletError} with code `ERR_WALLET_MULTIPLE_NOT_SUPPORTED`
   *         on Android when the array contains more than one entry. The
   *         Google Wallet API only accepts a single JWT per call; combine
   *         multiple passes into one JWT on your server.
   * @throws {@link WalletError} with code `ERR_WALLET_IN_PROGRESS` if a
   *         previous add-pass call is still awaiting a result.
   *
   * @remarks
   * The same outcome is also delivered via the `AddPassCompleted` event on
   * {@link createWalletEventEmitter}. The event is retained as a secondary
   * notification channel for multi-listener setups; the Promise return
   * value is the primary API in 2.x.
   */
  addPasses(passDataArray: string[]): Promise<boolean> {
    if (!Array.isArray(passDataArray) || passDataArray.length === 0) {
      return Promise.reject(
        walletError(
          'INVALID_PASS',
          'Pass data array must be a non-empty array of pass strings.'
        )
      );
    }

    try {
      for (const entry of passDataArray) {
        validatePassInput(entry);
      }
    } catch (error) {
      return Promise.reject(error);
    }

    if (Platform.OS === 'android' && passDataArray.length > 1) {
      return Promise.reject(
        walletError(
          'ERR_WALLET_MULTIPLE_NOT_SUPPORTED',
          'Google Wallet requires multiple passes to be combined into a single JWT. Call addPass with one combined JWT instead.'
        )
      );
    }

    return nativeModule.addPasses(passDataArray);
  },
};

/**
 * Creates an event emitter for listening to wallet events.
 *
 * @remarks
 * The emitted `AddPassCompleted` event payload is a raw `boolean` indicating
 * whether the pass was added successfully. It is not wrapped in an object.
 *
 * @example
 * ```typescript
 * const emitter = createWalletEventEmitter();
 * const subscription = emitter.addListener(
 *   'AddPassCompleted',
 *   (success: boolean) => {
 *     // success === true when the user added the pass,
 *     // success === false when the user cancelled.
 *   }
 * );
 *
 * subscription.remove();
 * ```
 */
export const createWalletEventEmitter = (): NativeEventEmitter =>
  new NativeEventEmitter(WalletKit);

export default WalletKitModule;
export { WalletButton, WalletButtonStyle };
