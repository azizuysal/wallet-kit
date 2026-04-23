import renderer, { act } from 'react-test-renderer';
import { WalletButton as IosWalletButton } from '../WalletButton.ios';
import { WalletButton as AndroidWalletButton } from '../WalletButton.android';
import { WalletButtonStyle } from '../WalletButton.types';

type AnyJson = ReturnType<ReturnType<typeof renderer.create>['toJSON']>;

const extractProps = (
  json: AnyJson
): { [key: string]: unknown } | undefined => {
  if (!json || Array.isArray(json) || typeof json !== 'object') {
    return undefined;
  }
  return json.props as { [key: string]: unknown };
};

type ButtonComponent = typeof IosWalletButton;

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
        const component = renderer.create(
          <Button addPassButtonStyle={style} />
        );
        const props = extractProps(component.toJSON());
        expect(props?.addPassButtonStyle).toBe(mapping[style]);
      });

      it('defaults to primary (0) when no style is provided', () => {
        const component = renderer.create(<Button />);
        const props = extractProps(component.toJSON());
        expect(props?.addPassButtonStyle).toBe(
          mapping[WalletButtonStyle.primary]
        );
      });

      it('falls back to 0 for an invalid style value', () => {
        const component = renderer.create(
          <Button
            addPassButtonStyle={'invalid' as unknown as WalletButtonStyle}
          />
        );
        const props = extractProps(component.toJSON());
        expect(props?.addPassButtonStyle).toBe(0);
      });
    });

    describe('Event handling', () => {
      it('invokes onPress when the native onPress is triggered', () => {
        const onPress = jest.fn();
        const component = renderer.create(<Button onPress={onPress} />);
        const props = extractProps(component.toJSON());

        const handler = props?.onPress as (() => void) | undefined;
        expect(typeof handler).toBe('function');
        handler?.();

        expect(onPress).toHaveBeenCalledTimes(1);
      });

      it('forwards onPress by reference (no wrapping)', () => {
        const onPress = jest.fn();
        const component = renderer.create(<Button onPress={onPress} />);
        const props = extractProps(component.toJSON());
        expect(props?.onPress).toBe(onPress);
      });

      it('does not throw when no onPress is provided', () => {
        const component = renderer.create(<Button />);
        expect(() => component.toJSON()).not.toThrow();
      });
    });

    describe('Props forwarding', () => {
      it('forwards style, testID and accessibility props to the native component', () => {
        const onPress = jest.fn();
        const component = renderer.create(
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
        const props = extractProps(component.toJSON());

        expect(props?.style).toEqual({ width: 250, height: 50 });
        expect(props?.testID).toBe(`${name}-button`);
        expect(props?.accessible).toBe(true);
        expect(props?.accessibilityLabel).toBe('Add to Wallet');
        expect(props?.accessibilityHint).toBe('Double tap to add pass');
        expect(props?.accessibilityRole).toBe('button');
      });
    });

    describe('Updates', () => {
      it('updates the native style mapping when addPassButtonStyle changes', () => {
        const component = renderer.create(
          <Button addPassButtonStyle={WalletButtonStyle.primary} />
        );
        expect(extractProps(component.toJSON())?.addPassButtonStyle).toBe(
          mapping[WalletButtonStyle.primary]
        );

        act(() => {
          component.update(
            <Button addPassButtonStyle={WalletButtonStyle.secondary} />
          );
        });
        expect(extractProps(component.toJSON())?.addPassButtonStyle).toBe(
          mapping[WalletButtonStyle.secondary]
        );

        act(() => {
          component.update(
            <Button addPassButtonStyle={WalletButtonStyle.outline} />
          );
        });
        expect(extractProps(component.toJSON())?.addPassButtonStyle).toBe(
          mapping[WalletButtonStyle.outline]
        );
      });

      it('updates the onPress handler when the prop changes', () => {
        const first = jest.fn();
        const second = jest.fn();
        const component = renderer.create(<Button onPress={first} />);
        (extractProps(component.toJSON())?.onPress as () => void)();
        expect(first).toHaveBeenCalledTimes(1);

        act(() => {
          component.update(<Button onPress={second} />);
        });
        (extractProps(component.toJSON())?.onPress as () => void)();
        expect(second).toHaveBeenCalledTimes(1);
      });
    });
  }
);

describe('WalletButton platform outline mapping', () => {
  it('maps outline differently on iOS (1) vs Android (2)', () => {
    const iosComponent = renderer.create(
      <IosWalletButton addPassButtonStyle={WalletButtonStyle.outline} />
    );
    const androidComponent = renderer.create(
      <AndroidWalletButton addPassButtonStyle={WalletButtonStyle.outline} />
    );

    expect(extractProps(iosComponent.toJSON())?.addPassButtonStyle).toBe(1);
    expect(extractProps(androidComponent.toJSON())?.addPassButtonStyle).toBe(2);
  });
});
