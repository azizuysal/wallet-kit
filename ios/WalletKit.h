#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <UIKit/UIKit.h>

@interface WalletKit : RCTEventEmitter <RCTBridgeModule, UIAdaptivePresentationControllerDelegate>

@end
