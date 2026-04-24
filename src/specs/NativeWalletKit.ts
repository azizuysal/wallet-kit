import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly canAddPasses: () => Promise<boolean>;
  readonly addPass: (passData: string) => Promise<boolean>;
  readonly addPasses: (passDataArray: Array<string>) => Promise<boolean>;
  readonly addListener: (eventName: string) => void;
  readonly removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.get<Spec>('WalletKit');
