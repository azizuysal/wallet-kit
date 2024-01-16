#import "WalletButton.h"
#import "RCTConvert+PassKit.h"

#import <PassKit/PassKit.h>
#import <React/RCTLog.h>

@interface PassButton: UIView
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@property (nonatomic) PKAddPassButtonStyle addPassButtonStyle;
@end

@implementation PassButton
- (void)setAddPassButtonStyle:(PKAddPassButtonStyle)addPassButtonStyle {
  if (self.subviews.firstObject != nil) {
    ((PKAddPassButton*)self.subviews.firstObject).addPassButtonStyle = addPassButtonStyle;
  }
}
- (void)onClick:(id)sender {
    if (self.onPress) {
        self.onPress(@{});
    }
}
@end

@implementation WalletButton
RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_CUSTOM_VIEW_PROPERTY(addPassButtonStyle, PKAddPassButtonStyle, PassButton) {
    view.addPassButtonStyle = [RCTConvert PKAddPassButtonStyle:json];
}

- (UIView *)view {
    PassButton *view = [PassButton new];
    PKAddPassButton *button = [PKAddPassButton new];
    [button setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
    [button addTarget:view action:@selector(onClick:) forControlEvents:UIControlEventTouchUpInside];
    [view setFrame:[button frame]];
    [view addSubview:button];
    return view;
}

@end

