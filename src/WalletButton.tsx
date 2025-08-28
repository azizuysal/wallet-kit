import React from 'react';
import { Platform, requireNativeComponent, type ViewProps } from 'react-native';

/**
 * Unified wallet button styles that work across platforms
 */
export enum WalletButtonStyle {
  /** Black button on iOS, dark button on Android */
  primary = 'primary',
  /** Black outline button on iOS, light button on Android */
  secondary = 'secondary',
  /** Black outline button on iOS, outline button on Android */
  outline = 'outline',
}

/**
 * Props for the WalletButton component
 */
export interface WalletButtonProps extends ViewProps {
  /**
   * The style of the button
   * @default WalletButtonStyle.primary
   */
  addPassButtonStyle?: WalletButtonStyle;
  /**
   * Callback when the button is pressed
   */
  onPress?: () => void;
}

// Platform-specific style mapping
const platformStyleMap = {
  ios: {
    [WalletButtonStyle.primary]: 0, // black
    [WalletButtonStyle.secondary]: 1, // blackOutline
    [WalletButtonStyle.outline]: 1, // blackOutline
  },
  android: {
    [WalletButtonStyle.primary]: 0, // dark
    [WalletButtonStyle.secondary]: 1, // light
    [WalletButtonStyle.outline]: 2, // outline
  },
};

// Get the native component
const NativeWalletButton =
  requireNativeComponent<WalletButtonProps>('WalletButton');

/**
 * Native wallet button component for adding passes to Apple Wallet or Google Wallet
 *
 * @example
 * ```typescript
 * <WalletButton
 *   style={{ width: 200, height: 48 }}
 *   addPassButtonStyle={WalletButtonStyle.primary}
 *   onPress={() => console.log('Button pressed')}
 * />
 * ```
 */
export const WalletButton: React.FC<WalletButtonProps> = ({
  addPassButtonStyle = WalletButtonStyle.primary,
  ...props
}) => {
  // Map the cross-platform style to the platform-specific numeric value
  const mappedStyle =
    platformStyleMap[Platform.OS as 'ios' | 'android']?.[addPassButtonStyle] ??
    0;

  return <NativeWalletButton {...props} addPassButtonStyle={mappedStyle} />;
};
