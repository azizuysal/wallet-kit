#import "WalletButton.h"

#import <PassKit/PassKit.h>

#ifdef RCT_NEW_ARCH_ENABLED

#import <react/renderer/components/RNWalletKitSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNWalletKitSpec/EventEmitters.h>
#import <react/renderer/components/RNWalletKitSpec/Props.h>
#import <react/renderer/components/RNWalletKitSpec/RCTComponentViewHelpers.h>
#import <react/renderer/components/RNWalletKitSpec/ShadowNodes.h>

using namespace facebook::react;

@interface WalletButtonComponentView () <RCTWalletButtonViewProtocol>
@end

@implementation WalletButtonComponentView {
  PKAddPassButton *_button;
}

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    _props = WalletButtonShadowNode::defaultSharedProps();
    _button = [PKAddPassButton addPassButtonWithStyle:PKAddPassButtonStyleBlack];
    _button.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [_button addTarget:self action:@selector(handlePress:) forControlEvents:UIControlEventTouchUpInside];
    self.contentView = _button;
  }
  return self;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<WalletButtonComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps {
  const auto &oldButtonProps = static_cast<const WalletButtonProps &>(*_props);
  const auto &newButtonProps = static_cast<const WalletButtonProps &>(*props);
  if (oldButtonProps.addPassButtonStyle != newButtonProps.addPassButtonStyle) {
    _button.addPassButtonStyle = [self nativeStyle:newButtonProps.addPassButtonStyle];
  }
  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  _button.addPassButtonStyle = PKAddPassButtonStyleBlack;
}

- (void)handlePress:(id)sender {
  if (_eventEmitter == nullptr) {
    return;
  }
  static_cast<const WalletButtonEventEmitter &>(*_eventEmitter)
      .onPress(WalletButtonEventEmitter::OnPress{.target = static_cast<int>(self.tag)});
}

- (PKAddPassButtonStyle)nativeStyle:(NSInteger)style {
  return style == 0 ? PKAddPassButtonStyleBlack : PKAddPassButtonStyleBlackOutline;
}

@end

#else

#import "RCTConvert+PassKit.h"

#import <React/RCTViewManager.h>

@interface WalletButtonContainer : UIView
@property(nonatomic, copy) RCTBubblingEventBlock onPress;
@property(nonatomic, strong) PKAddPassButton *button;
@end

@implementation WalletButtonContainer

- (void)setAddPassButtonStyle:(PKAddPassButtonStyle)style {
  self.button.addPassButtonStyle = style;
}

- (void)handlePress:(id)sender {
  if (self.onPress != nil) {
    self.onPress(@{});
  }
}

- (BOOL)isAccessibilityElement {
  return NO;
}

@end

@implementation WalletButton

RCT_EXPORT_MODULE()
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_CUSTOM_VIEW_PROPERTY(addPassButtonStyle, PKAddPassButtonStyle, WalletButtonContainer) {
  view.addPassButtonStyle = [RCTConvert PKAddPassButtonStyle:json];
}

- (UIView *)view {
  WalletButtonContainer *container = [WalletButtonContainer new];
  PKAddPassButton *button = [PKAddPassButton addPassButtonWithStyle:PKAddPassButtonStyleBlack];
  button.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [button addTarget:container action:@selector(handlePress:) forControlEvents:UIControlEventTouchUpInside];
  container.button = button;
  [container addSubview:button];
  return container;
}

@end

#endif
