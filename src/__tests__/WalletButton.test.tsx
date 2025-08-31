import renderer, { act } from 'react-test-renderer';
import { Platform } from 'react-native';
import { WalletButton, WalletButtonStyle } from '../WalletButton';

describe('WalletButton', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatform;
    jest.clearAllMocks();
  });

  describe('Snapshots', () => {
    it('should match snapshot with default props', () => {
      const component = renderer.create(<WalletButton />);
      expect(component.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with primary style on iOS', () => {
      Platform.OS = 'ios';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.primary} />
      );
      expect(component.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with secondary style on iOS', () => {
      Platform.OS = 'ios';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.secondary} />
      );
      expect(component.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with outline style on iOS', () => {
      Platform.OS = 'ios';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
      );
      expect(component.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with primary style on Android', () => {
      Platform.OS = 'android';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.primary} />
      );
      expect(component.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with secondary style on Android', () => {
      Platform.OS = 'android';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.secondary} />
      );
      expect(component.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with outline style on Android', () => {
      Platform.OS = 'android';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
      );
      expect(component.toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with custom props', () => {
      const component = renderer.create(
        <WalletButton
          style={{ width: 200, height: 48 }}
          onPress={() => {}}
          testID="snapshot-test"
          accessible={true}
          accessibilityLabel="Add to Wallet"
        />
      );
      expect(component.toJSON()).toMatchSnapshot();
    });
  });

  describe('Style Mapping Verification', () => {
    it('should map primary style to 0 on iOS', () => {
      Platform.OS = 'ios';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.primary} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(0);
      }
    });

    it('should map secondary style to 1 on iOS', () => {
      Platform.OS = 'ios';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.secondary} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(1);
      }
    });

    it('should map outline style to 1 on iOS', () => {
      Platform.OS = 'ios';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(1);
      }
    });

    it('should map primary style to 0 on Android', () => {
      Platform.OS = 'android';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.primary} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(0);
      }
    });

    it('should map secondary style to 1 on Android', () => {
      Platform.OS = 'android';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.secondary} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(1);
      }
    });

    it('should map outline style to 2 on Android', () => {
      Platform.OS = 'android';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(2);
      }
    });

    it('should map outline style differently between platforms', () => {
      Platform.OS = 'ios';
      const iosComponent = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
      );
      const iosInstance = iosComponent.toJSON();

      Platform.OS = 'android';
      const androidComponent = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
      );
      const androidInstance = androidComponent.toJSON();

      if (iosInstance && !Array.isArray(iosInstance)) {
        expect(iosInstance.props.addPassButtonStyle).toBe(1);
      }
      if (androidInstance && !Array.isArray(androidInstance)) {
        expect(androidInstance.props.addPassButtonStyle).toBe(2);
      }
    });

    it('should default to 0 when no style provided', () => {
      const component = renderer.create(<WalletButton />);
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(0);
      }
    });

    it('should default to 0 for unsupported platforms', () => {
      Platform.OS = 'web' as any;
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(0);
      }
    });

    it('should default to 0 for invalid style values', () => {
      const component = renderer.create(
        <WalletButton addPassButtonStyle={'invalid' as any} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(0);
      }
    });
  });

  describe('Event Handling', () => {
    it('should trigger onPress callback when pressed', () => {
      const onPress = jest.fn();
      const component = renderer.create(<WalletButton onPress={onPress} />);
      const instance = component.toJSON();

      if (instance && !Array.isArray(instance) && instance.props.onPress) {
        instance.props.onPress();
      }

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple press events', () => {
      const onPress = jest.fn();
      const component = renderer.create(<WalletButton onPress={onPress} />);
      const instance = component.toJSON();

      if (instance && !Array.isArray(instance) && instance.props.onPress) {
        instance.props.onPress();
        instance.props.onPress();
        instance.props.onPress();
      }

      expect(onPress).toHaveBeenCalledTimes(3);
    });

    it('should not crash when pressed without onPress handler', () => {
      const component = renderer.create(<WalletButton />);
      const instance = component.toJSON();

      expect(() => {
        if (instance && !Array.isArray(instance) && instance.props.onPress) {
          instance.props.onPress();
        }
      }).not.toThrow();
    });

    it('should pass onPress to native component', () => {
      const onPress = jest.fn();
      const component = renderer.create(<WalletButton onPress={onPress} />);
      const instance = component.toJSON();

      if (instance && !Array.isArray(instance)) {
        expect(instance.props.onPress).toBe(onPress);
      }
    });
  });

  describe('Props Forwarding', () => {
    it('should forward style prop to native component', () => {
      const customStyle = { width: 200, height: 48, marginTop: 10 };
      const component = renderer.create(<WalletButton style={customStyle} />);
      const instance = component.toJSON();

      if (instance && !Array.isArray(instance)) {
        expect(instance.props.style).toEqual(customStyle);
      }
    });

    it('should forward accessibility props to native component', () => {
      const accessibilityProps = {
        accessible: true,
        accessibilityLabel: 'Add to Wallet',
        accessibilityHint: 'Double tap to add pass',
        accessibilityRole: 'button' as const,
      };

      const component = renderer.create(
        <WalletButton {...accessibilityProps} />
      );
      const instance = component.toJSON();

      if (instance && !Array.isArray(instance)) {
        expect(instance.props.accessible).toBe(true);
        expect(instance.props.accessibilityLabel).toBe('Add to Wallet');
        expect(instance.props.accessibilityHint).toBe('Double tap to add pass');
        expect(instance.props.accessibilityRole).toBe('button');
      }
    });

    it('should forward testID to native component', () => {
      const component = renderer.create(
        <WalletButton testID="custom-test-id" />
      );
      const instance = component.toJSON();

      if (instance && !Array.isArray(instance)) {
        expect(instance.props.testID).toBe('custom-test-id');
      }
    });

    it('should forward all props simultaneously', () => {
      Platform.OS = 'ios';
      const allProps = {
        style: { width: 250 },
        addPassButtonStyle: WalletButtonStyle.secondary,
        onPress: jest.fn(),
        testID: 'all-props-test',
        accessible: true,
        accessibilityLabel: 'Button Label',
      };

      const component = renderer.create(<WalletButton {...allProps} />);
      const instance = component.toJSON();

      if (instance && !Array.isArray(instance)) {
        expect(instance.props.style).toEqual(allProps.style);
        expect(instance.props.addPassButtonStyle).toBe(1);
        expect(instance.props.onPress).toBe(allProps.onPress);
        expect(instance.props.accessible).toBe(true);
        expect(instance.props.accessibilityLabel).toBe('Button Label');
        expect(instance.props.testID).toBe('all-props-test');
      }
    });
  });

  describe('Component Updates', () => {
    it('should update style mapping when prop changes', () => {
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.primary} />
      );

      let instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(0);
      }

      act(() => {
        component.update(
          <WalletButton addPassButtonStyle={WalletButtonStyle.secondary} />
        );
      });

      instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(1);
      }
    });

    it('should update onPress handler when prop changes', () => {
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();

      const component = renderer.create(
        <WalletButton onPress={firstHandler} />
      );
      let instance = component.toJSON();

      if (instance && !Array.isArray(instance) && instance.props.onPress) {
        instance.props.onPress();
      }
      expect(firstHandler).toHaveBeenCalledTimes(1);
      expect(secondHandler).toHaveBeenCalledTimes(0);

      act(() => {
        component.update(<WalletButton onPress={secondHandler} />);
      });

      instance = component.toJSON();
      if (instance && !Array.isArray(instance) && instance.props.onPress) {
        instance.props.onPress();
      }
      expect(firstHandler).toHaveBeenCalledTimes(1);
      expect(secondHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle platform change during runtime', () => {
      Platform.OS = 'ios';
      const component = renderer.create(
        <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
      );

      let instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(1);
      }

      Platform.OS = 'android';
      act(() => {
        component.update(
          <WalletButton addPassButtonStyle={WalletButtonStyle.outline} />
        );
      });

      instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(2);
      }
    });
  });

  describe('Cross-Platform Consistency', () => {
    const testPlatformMapping = (
      platform: string,
      style: WalletButtonStyle,
      expected: number
    ) => {
      Platform.OS = platform as any;
      const component = renderer.create(
        <WalletButton addPassButtonStyle={style} />
      );
      const instance = component.toJSON();
      if (instance && !Array.isArray(instance)) {
        expect(instance.props.addPassButtonStyle).toBe(expected);
      }
    };

    it('should maintain consistent mapping for primary across platforms', () => {
      testPlatformMapping('ios', WalletButtonStyle.primary, 0);
      testPlatformMapping('android', WalletButtonStyle.primary, 0);
    });

    it('should maintain consistent mapping for secondary across platforms', () => {
      testPlatformMapping('ios', WalletButtonStyle.secondary, 1);
      testPlatformMapping('android', WalletButtonStyle.secondary, 1);
    });

    it('should have platform-specific mapping for outline', () => {
      testPlatformMapping('ios', WalletButtonStyle.outline, 1);
      testPlatformMapping('android', WalletButtonStyle.outline, 2);
    });
  });
});
