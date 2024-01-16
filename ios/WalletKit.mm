#import "WalletKit.h"
#import "UIViewController+WalletKit.h"

#import <PassKit/PassKit.h>
#import <React/RCTLog.h>
#import <React/RCTConvert.h>

@interface WalletKit () <PKAddPassesViewControllerDelegate> {
    BOOL hasListeners;
}
@property (nonatomic, retain) NSArray<PKPass *> *passes;
@end

@implementation WalletKit
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(canAddPasses:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    BOOL canAddPasses = [PKAddPassesViewController canAddPasses];
//    RCTLog(@"Called canAddPasses %d", canAddPasses);
    resolve(@(canAddPasses));
}

RCT_EXPORT_METHOD(addPass:(NSString *)passData resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
//    RCTLog(@"Called addPass");
    NSData *data = [[NSData alloc] initWithBase64EncodedString:passData options:0];
    NSError *error;
    PKPass *pass = [[PKPass alloc] initWithData:data error:&error];
    if (error) {
        reject(@"Wallet", @"Error in addPass", error);
        return;
    }
    self.passes = @[pass];
    PKAddPassesViewController *vc = [[PKAddPassesViewController alloc] initWithPass:pass];
    vc.delegate = self;
    dispatch_async(dispatch_get_main_queue(), ^{
        [self presentViewController:vc animated:YES completion:^{
            resolve(nil);
        }];
    });
}

RCT_EXPORT_METHOD(addPasses:(NSArray<NSString *> *)passDataArray resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
//    RCTLog(@"Called addPasses %lu", (unsigned long)passDataArray.count);
    NSError *error;
    NSMutableArray *passes = [NSMutableArray new];
    for (NSString *passData in passDataArray) {
        NSData *data = [[NSData alloc] initWithBase64EncodedString:passData options:0];
        PKPass *pass = [[PKPass alloc] initWithData:data error:&error];
        [passes addObject:pass];
    }
    if (error) {
        reject(@"Wallet", @"Error in addPasses", error);
        return;
    }
    self.passes = passes;
    PKAddPassesViewController *vc = [[PKAddPassesViewController alloc] initWithPasses:passes];
    vc.delegate = self;
    dispatch_async(dispatch_get_main_queue(), ^{
        [self presentViewController:vc animated:YES completion:^{
            resolve(nil);
        }];
    });
}

- (void)presentViewController:(UIViewController *)vc animated:(BOOL)flag completion:(void (^ _Nullable)())completion {
    UIViewController *topVC = [UIViewController topController];
    if (topVC.presentedViewController) {
        [topVC.presentedViewController dismissViewControllerAnimated:YES completion:^{
            [topVC presentViewController:vc animated:YES completion:completion];
        }];
    } else {
        [topVC presentViewController:vc animated:YES completion:completion];
    }
}

#pragma mark - PKAddPassesViewControllerDelegate

- (void)addPassesViewControllerDidFinish:(PKAddPassesViewController *)controller {
  [controller dismissViewControllerAnimated:YES completion:^{
      BOOL passesAdded = YES;
      PKPassLibrary *lib = [PKPassLibrary new];
      for (PKPass *pass in self.passes) {
          if (![lib containsPass:pass]) {
              passesAdded = NO;
          }
      }
//      RCTLog(@"ADDED %d", passesAdded);
      if (self->hasListeners) {
          [self sendEventWithName:@"AddPassCompleted" body:@(passesAdded)];
      }
  }];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"AddPassCompleted"];
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
    self.passes = nil;
}

@end
