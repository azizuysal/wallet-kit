import React from 'react';
import { requireNativeComponent } from 'react-native';
import type {
  NativeWalletButtonProps,
  WalletButtonProps,
} from './WalletButton.types';
import { WalletButtonStyle } from './WalletButton.types';

const styleMap: Record<WalletButtonStyle, number> = {
  [WalletButtonStyle.primary]: 0,
  [WalletButtonStyle.secondary]: 1,
  [WalletButtonStyle.outline]: 1,
};

const NativeWalletButton =
  requireNativeComponent<NativeWalletButtonProps>('WalletButton');

/**
 * Native wallet button component (iOS — PKAddPassButton).
 *
 * @remarks
 * Renders Apple's PKAddPassButton from the PassKit framework.
 * The button automatically adapts to the user's locale for text localization.
 */
export const WalletButton: React.FC<WalletButtonProps> = ({
  addPassButtonStyle = WalletButtonStyle.primary,
  ...props
}) => {
  const mappedStyle = styleMap[addPassButtonStyle] ?? 0;

  return <NativeWalletButton {...props} addPassButtonStyle={mappedStyle} />;
};
