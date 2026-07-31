import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type {
  BubblingEventHandler,
  Int32,
} from 'react-native/Libraries/Types/CodegenTypes';

type WalletButtonPressEvent = Readonly<{
  target: Int32;
}>;

export interface NativeProps extends ViewProps {
  addPassButtonStyle?: Int32;
  onPress?: BubblingEventHandler<WalletButtonPressEvent> | null;
}

export default codegenNativeComponent<NativeProps>(
  'WalletButton'
) as HostComponent<NativeProps>;
