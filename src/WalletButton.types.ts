import type { ViewProps } from 'react-native';

/**
 * Unified wallet button styles that work across platforms.
 *
 * @remarks
 * Style mappings by platform:
 * - iOS: Uses `PKAddPassButton` styles from PassKit. Apple only provides two
 *   visually-distinct styles (`PKAddPassButtonStyleBlack` = 0 and
 *   `PKAddPassButtonStyleBlackOutline` = 1), so on iOS `secondary` and
 *   `outline` render identically. Use whichever enum value best describes
 *   your intent in cross-platform code; both resolve to the outline variant
 *   on iOS.
 * - Android: Uses Google's standard black button for `primary` and approved
 *   condensed black button for `secondary`. Deprecated `outline` is an alias
 *   of `secondary`.
 *
 * @enum
 */
export enum WalletButtonStyle {
  /**
   * Primary style — black filled button on iOS, dark theme on Android.
   * @default
   */
  primary = 'primary',
  /**
   * Secondary style — black outline button on iOS and condensed black button
   * on Android.
   */
  secondary = 'secondary',
  /**
   * @deprecated Use {@link secondary}. This compatibility alias renders
   * identically on both platforms and will remain available throughout 2.x.
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

/**
 * Props passed to the underlying native component.
 *
 * @internal
 */
export interface NativeWalletButtonProps extends Omit<
  WalletButtonProps,
  'addPassButtonStyle'
> {
  addPassButtonStyle?: number;
}
