import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type WalletButtonPressEvent = Readonly<{
  target: CodegenTypes.Int32;
}>;

export interface NativeProps extends ViewProps {
  addPassButtonStyle?: CodegenTypes.Int32;
  onPress?: CodegenTypes.BubblingEventHandler<WalletButtonPressEvent> | null;
}

export default codegenNativeComponent<NativeProps>(
  'WalletButton'
) as HostComponent<NativeProps>;
