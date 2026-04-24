import React from 'react';
import type { WalletButtonProps } from './WalletButton.types';
import { WalletButtonStyle } from './WalletButton.types';
import NativeWalletButton from './specs/WalletButtonNativeComponent';

const styleMap: Record<WalletButtonStyle, number> = {
  [WalletButtonStyle.primary]: 0,
  [WalletButtonStyle.secondary]: 1,
  [WalletButtonStyle.outline]: 2,
};

/**
 * Native wallet button component (Android — Google Wallet button).
 *
 * @remarks
 * Renders the official Google Wallet button with correct branding and
 * locale-specific text via the Android drawable resources bundled with the
 * library.
 */
export const WalletButton: React.FC<WalletButtonProps> = ({
  addPassButtonStyle = WalletButtonStyle.primary,
  ...props
}) => {
  const mappedStyle = styleMap[addPassButtonStyle] ?? 0;

  return <NativeWalletButton {...props} addPassButtonStyle={mappedStyle} />;
};
