import { NativeModules, Platform } from 'react-native';
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

interface WalletInterface {
  canAddPasses(): Promise<boolean>;
  addPass(passData: string): Promise<void>;
  addPasses(passDataArray: string[]): Promise<void>;
}
export default WalletKit as WalletInterface;

export { WalletButton, WalletButtonStyle };
