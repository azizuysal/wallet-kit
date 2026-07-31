#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <UIKit/UIKit.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNWalletKitSpec/RNWalletKitSpec.h>
#endif

@interface WalletKit : RCTEventEmitter <RCTBridgeModule, UIAdaptivePresentationControllerDelegate
#ifdef RCT_NEW_ARCH_ENABLED
                                      , NativeWalletKitSpec
#endif
                                      >

@end
