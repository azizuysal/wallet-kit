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
  | 'INVALID_PASS'
  | 'USER_CANCELLED'
  | 'NOT_SUPPORTED'
  | 'PLAY_SERVICES_UNAVAILABLE'
  | 'ERR_WALLET_NOT_AVAILABLE'
  | 'ERR_WALLET_CANCELLED'
  | 'ERR_WALLET_UNKNOWN'
  | 'ERR_WALLET_ACTIVITY_NULL';

/**
 * Event payload for the AddPassCompleted event
 */
export interface AddPassCompletedEvent {
  /**
   * Whether the pass was successfully added to the wallet
   */
  success: boolean;
}

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
   * @throws {Error} With code 'USER_CANCELLED' if the user cancels the operation
   * @throws {Error} With code 'ERR_WALLET_NOT_AVAILABLE' if the wallet is not available
   *
   * @example
   * ```typescript
   * try {
   *   await WalletKit.addPass(passData);
   *   console.log('Pass addition UI shown');
   * } catch (error) {
   *   if (error.code === 'USER_CANCELLED') {
   *     console.log('User cancelled');
   *   }
   * }
   * ```
   */
  addPass(passData: string): Promise<void>;

  /**
   * Add multiple passes to the wallet.
   *
   * @param {string[]} passDataArray - Array of pass data strings (base64 for iOS, JWT for Android)
   * @returns {Promise<void>} Resolves when the pass addition UI is shown, rejects if there's an error
   * @throws {Error} With code 'USER_CANCELLED' if the user cancels the operation
   * @throws {Error} With code 'ERR_WALLET_NOT_AVAILABLE' if the wallet is not available
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
 * Utility function to detect pass type based on content
 *
 * @param {string} passData - The pass data to analyze
 * @returns {'pkpass' | 'jwt' | 'unknown'} The detected pass type
 */
export const detectPassType = (
  passData: string
): 'pkpass' | 'jwt' | 'unknown' => {
  // JWT typically has three base64url segments separated by dots
  if (passData.includes('.') && passData.split('.').length === 3) {
    return 'jwt';
  }

  // PKPass is base64 encoded binary data, usually starts with specific patterns
  try {
    const decoded = atob(passData.substring(0, 100));
    if (decoded.includes('PK')) {
      return 'pkpass';
    }
  } catch {
    // Not valid base64
  }

  return 'unknown';
};

export default WalletKitModule;
export { WalletButton, WalletButtonStyle };
