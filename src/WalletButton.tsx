import React from 'react';
import { Platform, requireNativeComponent, type ViewProps } from 'react-native';

/**
 * Unified wallet button styles that work across platforms.
 *
 * @remarks
 * Style mappings by platform:
 * - iOS: Uses PKAddPassButton styles from PassKit
 * - Android: Uses Google Wallet button themes
 *
 * @enum
 */
export enum WalletButtonStyle {
  /**
   * Primary style - Black filled button on iOS, dark theme on Android
   * @default
   */
  primary = 'primary',
  /**
   * Secondary style - Black outline button on iOS, light theme on Android
   */
  secondary = 'secondary',
  /**
   * Outline style - Black outline button on iOS, outline theme on Android
   */
  outline = 'outline',
}

/**
 * Props for the WalletButton component.
 *
 * @remarks
 * Extends React Native's ViewProps to support all standard view properties
 * like style, testID, accessible, etc.
 */
export interface WalletButtonProps extends ViewProps {
  /**
   * The visual style of the button.
   * @default WalletButtonStyle.primary
   * @see {@link WalletButtonStyle}
   */
  addPassButtonStyle?: WalletButtonStyle;
  /**
   * Callback function invoked when the button is pressed.
   *
   * @example
   * ```typescript
   * onPress={() => {
   *   WalletKit.addPass(passData);
   * }}
   * ```
   */
  onPress?: () => void;
}

const platformStyleMap = {
  ios: {
    [WalletButtonStyle.primary]: 0,
    [WalletButtonStyle.secondary]: 1,
    [WalletButtonStyle.outline]: 1,
  },
  android: {
    [WalletButtonStyle.primary]: 0,
    [WalletButtonStyle.secondary]: 1,
    [WalletButtonStyle.outline]: 2,
  },
};

interface NativeWalletButtonProps
  extends Omit<WalletButtonProps, 'addPassButtonStyle'> {
  addPassButtonStyle?: number;
}

const NativeWalletButton =
  requireNativeComponent<NativeWalletButtonProps>('WalletButton');

/**
 * Native wallet button component for adding passes to Apple Wallet or Google Wallet.
 *
 * @remarks
 * This component renders a platform-specific native button:
 * - **iOS**: PKAddPassButton from PassKit framework
 * - **Android**: Google Wallet button with official branding
 *
 * The button automatically adapts its appearance based on the platform and
 * respects the user's locale for proper text localization.
 *
 * @example
 * Basic usage:
 * ```tsx
 * import { WalletButton, WalletButtonStyle } from '@azizuysal/wallet-kit';
 *
 * <WalletButton
 *   style={{ width: 200, height: 48 }}
 *   addPassButtonStyle={WalletButtonStyle.primary}
 *   onPress={() => console.log('Button pressed')}
 * />
 * ```
 *
 * @example
 * With pass addition:
 * ```tsx
 * <WalletButton
 *   style={{ width: 250, height: 50 }}
 *   addPassButtonStyle={WalletButtonStyle.outline}
 *   onPress={async () => {
 *     try {
 *       await WalletKit.addPass(passData);
 *     } catch (error) {
 *       console.error('Failed to add pass:', error);
 *     }
 *   }}
 *   testID="add-to-wallet-button"
 * />
 * ```
 *
 * @param props - The component props
 * @returns A native wallet button component
 */
export const WalletButton: React.FC<WalletButtonProps> = ({
  addPassButtonStyle = WalletButtonStyle.primary,
  ...props
}) => {
  const mappedStyle =
    platformStyleMap[Platform.OS as 'ios' | 'android']?.[addPassButtonStyle] ??
    0;

  return <NativeWalletButton {...props} addPassButtonStyle={mappedStyle} />;
};
