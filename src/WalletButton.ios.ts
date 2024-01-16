import { requireNativeComponent, type ViewProps } from 'react-native';

export enum WalletButtonStyle {
  black,
  blackOutline,
}

interface WalletButtonProps extends ViewProps {
  addPassButtonStyle?: WalletButtonStyle;
  onPress?: () => void;
}

export const WalletButton =
  requireNativeComponent<WalletButtonProps>('WalletButton');
