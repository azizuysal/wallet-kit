#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>

@interface WalletButtonComponentView : RCTViewComponentView

@end
#else
#import <React/RCTViewManager.h>

@interface WalletButton : RCTViewManager

@end
#endif
