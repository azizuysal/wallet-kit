#import "WalletKit.h"
#import "UIViewController+WalletKit.h"

#import <PassKit/PassKit.h>
#import <React/RCTLog.h>
#import <React/RCTConvert.h>

@interface WalletKit () <PKAddPassesViewControllerDelegate> {
    BOOL hasListeners;
}
@property (nonatomic, strong) NSArray<PKPass *> *passes;
@property (nonatomic, strong) NSArray<NSNumber *> *passesAlreadyInLibrary;
@end

@implementation WalletKit
RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
    return @[@"AddPassCompleted"];
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
}

RCT_EXPORT_METHOD(canAddPasses:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    BOOL canAddPasses = [PKAddPassesViewController canAddPasses];
    resolve(@(canAddPasses));
}

RCT_EXPORT_METHOD(addPass:(NSString *)passData resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    if (![passData isKindOfClass:[NSString class]] || passData.length == 0) {
        reject(@"INVALID_PASS", @"Pass data must be a non-empty base64-encoded string", nil);
        return;
    }

    PKPass *pass = [self buildPassFromBase64String:passData
                                invalidDataMessage:@"Pass data is not valid base64"
                                       rejectBlock:reject];
    if (pass == nil) {
        return;
    }

    [self trackPasses:@[pass]];

    PKAddPassesViewController *vc = [[PKAddPassesViewController alloc] initWithPass:pass];
    [self presentAddPassesViewController:vc resolve:resolve];
}

RCT_EXPORT_METHOD(addPasses:(NSArray<NSString *> *)passDataArray resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    if (![passDataArray isKindOfClass:[NSArray class]] || passDataArray.count == 0) {
        reject(@"INVALID_PASS", @"Pass data array must be a non-empty array of pass strings", nil);
        return;
    }

    NSMutableArray<PKPass *> *passes = [NSMutableArray arrayWithCapacity:passDataArray.count];
    for (NSUInteger index = 0; index < passDataArray.count; index++) {
        id entry = passDataArray[index];
        if (![entry isKindOfClass:[NSString class]] || [(NSString *)entry length] == 0) {
            NSString *message = [NSString stringWithFormat:@"Pass data at index %lu must be a non-empty base64-encoded string", (unsigned long)index];
            reject(@"INVALID_PASS", message, nil);
            return;
        }

        NSString *indexedMessage = [NSString stringWithFormat:@"Pass data at index %lu is not valid base64", (unsigned long)index];
        PKPass *pass = [self buildPassFromBase64String:(NSString *)entry
                                              invalidDataMessage:indexedMessage
                                                     rejectBlock:reject];
        if (pass == nil) {
            return;
        }

        [passes addObject:pass];
    }

    [self trackPasses:passes];

    PKAddPassesViewController *vc = [[PKAddPassesViewController alloc] initWithPasses:passes];
    [self presentAddPassesViewController:vc resolve:resolve];
}

#pragma mark - Helpers

- (PKPass *)buildPassFromBase64String:(NSString *)passData
                   invalidDataMessage:(NSString *)invalidDataMessage
                          rejectBlock:(RCTPromiseRejectBlock)reject {
    NSData *data = [[NSData alloc] initWithBase64EncodedString:passData
                                                       options:NSDataBase64DecodingIgnoreUnknownCharacters];
    if (data == nil) {
        reject(@"INVALID_PASS", invalidDataMessage, nil);
        return nil;
    }

    NSError *error = nil;
    PKPass *pass = [[PKPass alloc] initWithData:data error:&error];
    if (pass == nil || error != nil) {
        [self rejectWithPKError:error rejectBlock:reject];
        return nil;
    }
    return pass;
}

- (void)rejectWithPKError:(NSError *)error rejectBlock:(RCTPromiseRejectBlock)reject {
    NSString *errorCode = @"ERR_WALLET_UNKNOWN";
    NSString *errorMessage = @"Failed to create pass from data";

    if (error != nil) {
        if (error.code == PKInvalidDataError) {
            errorCode = @"INVALID_PASS";
            errorMessage = @"Invalid pass data format";
        } else if (error.code == PKUnsupportedVersionError) {
            errorCode = @"UNSUPPORTED_VERSION";
            errorMessage = @"Pass version not supported";
        }
    }

    reject(errorCode, errorMessage, error);
}

- (void)trackPasses:(NSArray<PKPass *> *)passes {
    PKPassLibrary *library = [PKPassLibrary new];
    NSMutableArray<NSNumber *> *alreadyInLibrary = [NSMutableArray arrayWithCapacity:passes.count];
    for (PKPass *pass in passes) {
        [alreadyInLibrary addObject:@([library containsPass:pass])];
    }

    self.passes = [passes copy];
    self.passesAlreadyInLibrary = [alreadyInLibrary copy];
}

- (void)presentAddPassesViewController:(PKAddPassesViewController *)vc
                               resolve:(RCTPromiseResolveBlock)resolve {
    vc.delegate = self;

    dispatch_async(dispatch_get_main_queue(), ^{
        [self presentViewController:vc animated:YES completion:^{
            // The presentationController is only non-nil after the view
            // controller has actually been presented, so the delegate must be
            // assigned here rather than before `presentViewController:`.
            if (@available(iOS 13.0, *)) {
                vc.presentationController.delegate = self;
            }
            resolve(nil);
        }];
    });
}

- (void)presentViewController:(UIViewController *)vc animated:(BOOL)flag completion:(void (^ _Nullable)(void))completion {
    UIViewController *topVC = [UIViewController topController];
    if (topVC.presentedViewController) {
        [topVC.presentedViewController dismissViewControllerAnimated:YES completion:^{
            [topVC presentViewController:vc animated:YES completion:completion];
        }];
    } else {
        [topVC presentViewController:vc animated:YES completion:completion];
    }
}

- (void)emitCompletionAndClear {
    if (self.passes == nil) {
        return;
    }

    NSArray<PKPass *> *passes = self.passes;
    NSArray<NSNumber *> *alreadyInLibrary = self.passesAlreadyInLibrary;
    self.passes = nil;
    self.passesAlreadyInLibrary = nil;

    BOOL allNewlyAdded = passes.count > 0;
    PKPassLibrary *library = [PKPassLibrary new];
    for (NSUInteger index = 0; index < passes.count; index++) {
        PKPass *pass = passes[index];
        BOOL wasAlreadyPresent = index < alreadyInLibrary.count
            ? [alreadyInLibrary[index] boolValue]
            : NO;
        BOOL isNowPresent = [library containsPass:pass];
        if (wasAlreadyPresent || !isNowPresent) {
            allNewlyAdded = NO;
            break;
        }
    }

    if (hasListeners) {
        [self sendEventWithName:@"AddPassCompleted" body:@(allNewlyAdded)];
    }
}

#pragma mark - PKAddPassesViewControllerDelegate

- (void)addPassesViewControllerDidFinish:(PKAddPassesViewController *)controller {
    __weak WalletKit *weakSelf = self;
    [controller dismissViewControllerAnimated:YES completion:^{
        [weakSelf emitCompletionAndClear];
    }];
}

#pragma mark - UIAdaptivePresentationControllerDelegate

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController API_AVAILABLE(ios(13.0)) {
    [self emitCompletionAndClear];
}

@end
