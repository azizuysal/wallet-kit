import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { WalletButton, WalletButtonStyle } from './WalletButton';

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
 * Error codes that can be returned by the wallet operations
 */
export type WalletErrorCode =
  // Pass validation errors
  | 'INVALID_PASS' // Invalid pass data format
  | 'UNSUPPORTED_VERSION' // Pass version not supported

  // User actions
  | 'ERR_WALLET_CANCELLED' // User cancelled the operation

  // System availability
  | 'ERR_WALLET_NOT_AVAILABLE' // Wallet app not available on device
  | 'ERR_WALLET_ACTIVITY_NULL' // Android: Activity is null

  // Generic errors
  | 'ERR_WALLET_UNKNOWN'; // Unknown error occurred

/**
 * Event payload for the AddPassCompleted event
 * The event directly contains a boolean value indicating success
 */
export type AddPassCompletedEvent = boolean;

/**
 * Main interface for WalletKit operations
 */
interface WalletInterface {
  /**
   * Check if the device can add passes to the wallet.
   *
   * @returns {Promise<boolean>} True if the device supports adding passes, false otherwise
   *
   * @example
   * ```typescript
   * const canAdd = await WalletKit.canAddPasses();
   * if (canAdd) {
   *   console.log('Device can add passes to wallet');
   * }
   * ```
   */
  canAddPasses(): Promise<boolean>;

  /**
   * Add a single pass to the wallet.
   *
   * @param {string} passData - The pass data as a base64-encoded string (iOS) or JWT (Android)
   * @returns {Promise<void>} Resolves when the pass addition UI is shown, rejects if there's an error
   * @throws {Error} With code 'INVALID_PASS' if the pass data format is invalid
   * @throws {Error} With code 'ERR_WALLET_CANCELLED' if the user cancels the operation
   * @throws {Error} With code 'ERR_WALLET_NOT_AVAILABLE' if the wallet is not available
   * @throws {Error} With code 'ERR_WALLET_ACTIVITY_NULL' if the Android activity is null
   * @throws {Error} With code 'ERR_WALLET_UNKNOWN' for other errors
   *
   * @example
   * ```typescript
   * try {
   *   await WalletKit.addPass(passData);
   *   console.log('Pass addition UI shown');
   * } catch (error) {
   *   if (error.code === 'ERR_WALLET_CANCELLED') {
   *     console.log('User cancelled');
   *   }
   * }
   * ```
   */
  addPass(passData: string): Promise<void>;

  /**
   * Add multiple passes to the wallet.
   *
   * **Note for Android:** Google Wallet API currently only supports adding one JWT at a time.
   * When multiple JWTs are provided, only the first one will be added. For true multi-pass
   * support on Android, combine multiple passes into a single JWT on your server.
   *
   * @param {string[]} passDataArray - Array of pass data strings (base64 for iOS, JWT for Android)
   * @returns {Promise<void>} Resolves when the pass addition UI is shown, rejects if there's an error
   * @throws {Error} With code 'INVALID_PASS' if the pass data format is invalid
   * @throws {Error} With code 'ERR_WALLET_CANCELLED' if the user cancels the operation
   * @throws {Error} With code 'ERR_WALLET_NOT_AVAILABLE' if the wallet is not available
   * @throws {Error} With code 'ERR_WALLET_ACTIVITY_NULL' if the Android activity is null
   * @throws {Error} With code 'ERR_WALLET_UNKNOWN' for other errors
   *
   * @example
   * ```typescript
   * try {
   *   await WalletKit.addPasses([passData1, passData2]);
   *   console.log('Multiple passes addition UI shown');
   * } catch (error) {
   *   console.error('Failed to add passes:', error);
   * }
   * ```
   */
  addPasses(passDataArray: string[]): Promise<void>;
}

/**
 * The main WalletKit module for interacting with Apple Wallet (iOS) and Google Wallet (Android)
 */
const WalletKitModule = WalletKit as WalletInterface;

/**
 * Create an event emitter for listening to wallet events
 *
 * @example
 * ```typescript
 * const eventEmitter = new NativeEventEmitter(WalletKit);
 * const subscription = eventEmitter.addListener('AddPassCompleted', (event: AddPassCompletedEvent) => {
 *   console.log('Pass added:', event.success);
 * });
 *
 * // Don't forget to remove the listener when done
 * subscription.remove();
 * ```
 */
export const createWalletEventEmitter = () => new NativeEventEmitter(WalletKit);

/**
 * Utility function to check if a string is valid base64url and can be decoded
 * Base64url uses URL and filename safe alphabet: A-Z, a-z, 0-9, -, _
 *
 * @param {string} str - The string to validate
 * @returns {boolean} True if the string is valid base64url and can be decoded
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
 * Utility function to detect pass type based on content
 *
 * @param {string} passData - The pass data to analyze
 * @returns {'pkpass' | 'jwt' | 'unknown'} The detected pass type
 */
export const detectPassType = (
  passData: string
): 'pkpass' | 'jwt' | 'unknown' => {
  if (passData.includes('.')) {
    const segments = passData.split('.');
    if (
      segments.length === 3 &&
      segments.every((segment) => isValidBase64Url(segment))
    ) {
      return 'jwt';
    }
  }

  try {
    const decoded = atob(passData.substring(0, 100));
    if (decoded.includes('PK')) {
      return 'pkpass';
    }
  } catch {}

  return 'unknown';
};

export default WalletKitModule;
export { WalletButton, WalletButtonStyle };
