import { render } from '@testing-library/react-native';
import { WalletButton as IosWalletButton } from '../WalletButton.ios';
import { WalletButton as AndroidWalletButton } from '../WalletButton.android';
import { WalletButtonStyle } from '../WalletButton.types';

type ButtonComponent = typeof IosWalletButton;

type NativeProps = { [key: string]: unknown };

const getNativeProps = (
  root: ReturnType<typeof render>['UNSAFE_root']
): NativeProps => {
  const native = root.findByType('WalletButton' as never);
  return native.props as NativeProps;
};

const platformSuites: Array<{
  name: string;
  Button: ButtonComponent;
  mapping: Record<WalletButtonStyle, number>;
}> = [
  {
    name: 'iOS',
    Button: IosWalletButton,
    mapping: {
      [WalletButtonStyle.primary]: 0,
      [WalletButtonStyle.secondary]: 1,
      [WalletButtonStyle.outline]: 1,
    },
  },
  {
    name: 'Android',
    Button: AndroidWalletButton,
    mapping: {
      [WalletButtonStyle.primary]: 0,
      [WalletButtonStyle.secondary]: 1,
      [WalletButtonStyle.outline]: 2,
    },
  },
];

describe.each(platformSuites)(
  'WalletButton ($name)',
  ({ Button, mapping, name }) => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('Style mapping', () => {
      it.each([
        [WalletButtonStyle.primary],
        [WalletButtonStyle.secondary],
        [WalletButtonStyle.outline],
      ])('maps %s to its platform-specific native value', (style) => {
        const { UNSAFE_root } = render(<Button addPassButtonStyle={style} />);
        expect(getNativeProps(UNSAFE_root).addPassButtonStyle).toBe(
          mapping[style]
        );
      });

      it('defaults to primary (0) when no style is provided', () => {
        const { UNSAFE_root } = render(<Button />);
        expect(getNativeProps(UNSAFE_root).addPassButtonStyle).toBe(
          mapping[WalletButtonStyle.primary]
        );
      });

      it('falls back to 0 for an invalid style value', () => {
        const { UNSAFE_root } = render(
          <Button
            addPassButtonStyle={'invalid' as unknown as WalletButtonStyle}
          />
        );
        expect(getNativeProps(UNSAFE_root).addPassButtonStyle).toBe(0);
      });
    });

    describe('Event handling', () => {
      it('forwards onPress by reference to the native component', () => {
        const onPress = jest.fn();
        const { UNSAFE_root } = render(<Button onPress={onPress} />);
        const nativeOnPress = getNativeProps(UNSAFE_root).onPress as
          | (() => void)
          | undefined;
        expect(nativeOnPress).toBe(onPress);
      });

      it('invokes onPress when the native onPress is triggered', () => {
        const onPress = jest.fn();
        const { UNSAFE_root } = render(<Button onPress={onPress} />);
        const nativeOnPress = getNativeProps(UNSAFE_root).onPress as
          | (() => void)
          | undefined;

        expect(typeof nativeOnPress).toBe('function');
        nativeOnPress?.();
        expect(onPress).toHaveBeenCalledTimes(1);
      });

      it('does not throw when no onPress is provided', () => {
        expect(() => render(<Button />)).not.toThrow();
      });
    });

    describe('Props forwarding', () => {
      it('forwards style, testID and accessibility props to the native component', () => {
        const onPress = jest.fn();
        const { UNSAFE_root } = render(
          <Button
            style={{ width: 250, height: 50 }}
            onPress={onPress}
            testID={`${name}-button`}
            accessible
            accessibilityLabel="Add to Wallet"
            accessibilityHint="Double tap to add pass"
            accessibilityRole="button"
          />
        );
        const props = getNativeProps(UNSAFE_root);

        expect(props.style).toEqual({ width: 250, height: 50 });
        expect(props.testID).toBe(`${name}-button`);
        expect(props.accessible).toBe(true);
        expect(props.accessibilityLabel).toBe('Add to Wallet');
        expect(props.accessibilityHint).toBe('Double tap to add pass');
        expect(props.accessibilityRole).toBe('button');
      });
    });

    describe('Updates', () => {
      it('updates the native style mapping when addPassButtonStyle changes', () => {
        const { UNSAFE_root, rerender } = render(
          <Button addPassButtonStyle={WalletButtonStyle.primary} />
        );
        expect(getNativeProps(UNSAFE_root).addPassButtonStyle).toBe(
          mapping[WalletButtonStyle.primary]
        );

        rerender(<Button addPassButtonStyle={WalletButtonStyle.secondary} />);
        expect(getNativeProps(UNSAFE_root).addPassButtonStyle).toBe(
          mapping[WalletButtonStyle.secondary]
        );

        rerender(<Button addPassButtonStyle={WalletButtonStyle.outline} />);
        expect(getNativeProps(UNSAFE_root).addPassButtonStyle).toBe(
          mapping[WalletButtonStyle.outline]
        );
      });

      it('updates the onPress handler when the prop changes', () => {
        const first = jest.fn();
        const second = jest.fn();
        const { UNSAFE_root, rerender } = render(<Button onPress={first} />);

        (getNativeProps(UNSAFE_root).onPress as () => void)();
        expect(first).toHaveBeenCalledTimes(1);

        rerender(<Button onPress={second} />);
        (getNativeProps(UNSAFE_root).onPress as () => void)();
        expect(second).toHaveBeenCalledTimes(1);
      });
    });
  }
);

describe('WalletButton platform outline mapping', () => {
  it('maps outline differently on iOS (1) vs Android (2)', () => {
    const { UNSAFE_root: iosRoot } = render(
      <IosWalletButton addPassButtonStyle={WalletButtonStyle.outline} />
    );
    const { UNSAFE_root: androidRoot } = render(
      <AndroidWalletButton addPassButtonStyle={WalletButtonStyle.outline} />
    );

    expect(
      (iosRoot.findByType('WalletButton' as never).props as NativeProps)
        .addPassButtonStyle
    ).toBe(1);
    expect(
      (androidRoot.findByType('WalletButton' as never).props as NativeProps)
        .addPassButtonStyle
    ).toBe(2);
  });
});
