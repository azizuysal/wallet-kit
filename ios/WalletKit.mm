#import "WalletKit.h"

#import <PassKit/PassKit.h>
#import <React/RCTUtils.h>

@interface WalletKit () <PKAddPassesViewControllerDelegate> {
  BOOL hasListeners;
}
@property(nonatomic, strong) NSArray<PKPass *> *passes;
@property(nonatomic, strong) NSArray<NSNumber *> *passesAlreadyInLibrary;
@property(nonatomic, strong) PKAddPassesViewController *presentedController;
@property(nonatomic, copy) RCTPromiseResolveBlock pendingResolve;
@property(nonatomic, copy) RCTPromiseRejectBlock pendingReject;
@property(nonatomic, copy) BOOL (^availabilityProvider)(void);
@property(nonatomic, copy) PKPass * _Nullable (^passFactory)(NSData *, NSError **);
@property(nonatomic, copy) PKAddPassesViewController * _Nullable (^singleControllerFactory)(PKPass *);
@property(nonatomic, copy) PKAddPassesViewController * _Nullable (^multipleControllerFactory)(NSArray<PKPass *> *);
@property(nonatomic, copy) UIViewController * _Nullable (^presenterProvider)(void);
@property(nonatomic, copy) BOOL (^containsPassProvider)(PKPass *);
@end

@implementation WalletKit

RCT_EXPORT_MODULE()

- (instancetype)init {
  self = [super init];
  if (self) {
    _availabilityProvider = ^BOOL {
      return [PKAddPassesViewController canAddPasses];
    };
    _passFactory = ^PKPass * _Nullable(NSData *data, NSError **error) {
      return [[PKPass alloc] initWithData:data error:error];
    };
    _singleControllerFactory = ^PKAddPassesViewController * _Nullable(PKPass *pass) {
      return [[PKAddPassesViewController alloc] initWithPass:pass];
    };
    _multipleControllerFactory = ^PKAddPassesViewController * _Nullable(NSArray<PKPass *> *passes) {
      return [[PKAddPassesViewController alloc] initWithPasses:passes];
    };
    _presenterProvider = ^UIViewController * _Nullable {
      return RCTPresentedViewController();
    };
    _containsPassProvider = ^BOOL(PKPass *pass) {
      return [[PKPassLibrary new] containsPass:pass];
    };
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"AddPassCompleted"];
}

- (void)startObserving {
  hasListeners = YES;
}

- (void)stopObserving {
  hasListeners = NO;
}

RCT_EXPORT_METHOD(canAddPasses:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  resolve(@(self.availabilityProvider()));
}

RCT_EXPORT_METHOD(addPass:(NSString *)passData
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSString *errorCode = nil;
  NSString *errorMessage = nil;
  NSError *passError = nil;
  PKPass *pass = [self passFromBase64String:passData
                         invalidDataMessage:@"Pass data is not valid base64"
                                  errorCode:&errorCode
                               errorMessage:&errorMessage
                                      error:&passError];
  if (pass == nil) {
    reject(errorCode, errorMessage, passError);
    return;
  }

  if (![self claimPendingResolve:resolve reject:reject]) {
    return;
  }

  [self beginPresentationForPasses:@[pass]
                 controllerFactory:^PKAddPassesViewController * _Nullable {
                   return self.singleControllerFactory(pass);
                 }];
}

RCT_EXPORT_METHOD(addPasses:(NSArray<NSString *> *)passDataArray
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (![passDataArray isKindOfClass:[NSArray class]] || passDataArray.count == 0) {
    reject(@"INVALID_PASS", @"Pass data array must be a non-empty array of pass strings", nil);
    return;
  }

  NSMutableArray<PKPass *> *passes = [NSMutableArray arrayWithCapacity:passDataArray.count];
  for (NSUInteger index = 0; index < passDataArray.count; index++) {
    id entry = passDataArray[index];
    if (![entry isKindOfClass:[NSString class]] || [(NSString *)entry length] == 0) {
      NSString *message = [NSString stringWithFormat:
        @"Pass data at index %lu must be a non-empty base64-encoded string",
        (unsigned long)index];
      reject(@"INVALID_PASS", message, nil);
      return;
    }

    NSString *invalidMessage = [NSString stringWithFormat:
      @"Pass data at index %lu is not valid base64", (unsigned long)index];
    NSString *errorCode = nil;
    NSString *errorMessage = nil;
    NSError *passError = nil;
    PKPass *pass = [self passFromBase64String:(NSString *)entry
                           invalidDataMessage:invalidMessage
                                    errorCode:&errorCode
                                 errorMessage:&errorMessage
                                        error:&passError];
    if (pass == nil) {
      reject(errorCode, errorMessage, passError);
      return;
    }
    [passes addObject:pass];
  }

  if (![self claimPendingResolve:resolve reject:reject]) {
    return;
  }

  NSArray<PKPass *> *immutablePasses = [passes copy];
  [self beginPresentationForPasses:immutablePasses
                 controllerFactory:^PKAddPassesViewController * _Nullable {
                   return self.multipleControllerFactory(immutablePasses);
                 }];
}

#pragma mark - Operation lifecycle

- (BOOL)claimPendingResolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  @synchronized(self) {
    if (self.pendingResolve != nil) {
      reject(@"ERR_WALLET_IN_PROGRESS",
             @"Another add-pass call is already in flight. Wait for it to resolve or reject before issuing another.",
             nil);
      return NO;
    }
    self.pendingResolve = resolve;
    self.pendingReject = reject;
    return YES;
  }
}

- (void)beginPresentationForPasses:(NSArray<PKPass *> *)passes
                 controllerFactory:(PKAddPassesViewController * _Nullable (^)(void))controllerFactory {
  if (!self.availabilityProvider()) {
    [self rejectPending:@"ERR_WALLET_NOT_AVAILABLE"
                message:@"Apple Wallet cannot add passes on this device"
                  error:nil];
    return;
  }

  PKAddPassesViewController *controller = controllerFactory();
  if (controller == nil) {
    [self rejectPending:@"ERR_WALLET_NOT_AVAILABLE"
                message:@"Apple Wallet could not create an add-pass controller"
                  error:nil];
    return;
  }

  [self trackPasses:passes];
  controller.delegate = self;
  self.presentedController = controller;

  dispatch_async(dispatch_get_main_queue(), ^{
    if (![self hasPendingOperation]) {
      return;
    }

    UIViewController *presenter = self.presenterProvider();
    if (presenter == nil || presenter.view.window == nil) {
      [self rejectPending:@"ERR_WALLET_UNKNOWN"
                  message:@"Unable to present Apple Wallet because no active view controller is available"
                    error:nil];
      return;
    }

    @try {
      [presenter presentViewController:controller animated:YES completion:^{
        if (controller.presentingViewController == nil) {
          [self rejectPending:@"ERR_WALLET_UNKNOWN"
                      message:@"Apple Wallet add-pass controller failed to present"
                        error:nil];
          return;
        }
        controller.presentationController.delegate = self;
      }];
    } @catch (NSException *exception) {
      NSError *error = [NSError errorWithDomain:@"WalletKitPresentation"
                                           code:1
                                       userInfo:@{NSLocalizedDescriptionKey: exception.reason ?: @"Presentation failed"}];
      [self rejectPending:@"ERR_WALLET_UNKNOWN"
                  message:@"Apple Wallet add-pass controller failed to present"
                    error:error];
    }
  });
}

- (BOOL)hasPendingOperation {
  @synchronized(self) {
    return self.pendingResolve != nil;
  }
}

- (void)rejectPending:(NSString *)code message:(NSString *)message error:(NSError *)error {
  RCTPromiseRejectBlock reject = nil;
  @synchronized(self) {
    reject = self.pendingReject;
    [self clearOperationState];
  }
  if (reject != nil) {
    reject(code, message, error);
  }
}

- (void)resolvePendingWithOutcome:(BOOL)outcome {
  RCTPromiseResolveBlock resolve = nil;
  @synchronized(self) {
    resolve = self.pendingResolve;
    [self clearOperationState];
  }
  if (resolve != nil) {
    resolve(@(outcome));
  }
}

- (void)clearOperationState {
  self.pendingResolve = nil;
  self.pendingReject = nil;
  self.passes = nil;
  self.passesAlreadyInLibrary = nil;
  self.presentedController.delegate = nil;
  self.presentedController.presentationController.delegate = nil;
  self.presentedController = nil;
}

#pragma mark - Pass construction and outcome

- (PKPass *)passFromBase64String:(NSString *)passData
               invalidDataMessage:(NSString *)invalidDataMessage
                        errorCode:(NSString **)errorCode
                     errorMessage:(NSString **)errorMessage
                            error:(NSError **)returnedError {
  if (![passData isKindOfClass:[NSString class]] || passData.length == 0) {
    *errorCode = @"INVALID_PASS";
    *errorMessage = @"Pass data must be a non-empty base64-encoded string";
    return nil;
  }

  NSArray<NSString *> *components = [passData componentsSeparatedByCharactersInSet:
    [NSCharacterSet whitespaceAndNewlineCharacterSet]];
  NSString *normalizedPassData = [components componentsJoinedByString:@""];
  NSData *data = [[NSData alloc] initWithBase64EncodedString:normalizedPassData
                                                     options:0];
  if (data == nil) {
    *errorCode = @"INVALID_PASS";
    *errorMessage = invalidDataMessage;
    return nil;
  }

  NSError *passError = nil;
  PKPass *pass = self.passFactory(data, &passError);
  if (pass != nil && passError == nil) {
    return pass;
  }

  *returnedError = passError;
  if (passError.code == PKInvalidDataError) {
    *errorCode = @"INVALID_PASS";
    *errorMessage = @"Invalid pass data format";
  } else if (passError.code == PKUnsupportedVersionError) {
    *errorCode = @"UNSUPPORTED_VERSION";
    *errorMessage = @"Pass version not supported";
  } else {
    *errorCode = @"ERR_WALLET_UNKNOWN";
    *errorMessage = @"Failed to create pass from data";
  }
  return nil;
}

- (void)trackPasses:(NSArray<PKPass *> *)passes {
  NSMutableArray<NSNumber *> *alreadyPresent = [NSMutableArray arrayWithCapacity:passes.count];
  for (PKPass *pass in passes) {
    [alreadyPresent addObject:@(self.containsPassProvider(pass))];
  }
  self.passes = [passes copy];
  self.passesAlreadyInLibrary = [alreadyPresent copy];
}

- (void)finishAndResolve {
  if (![self hasPendingOperation]) {
    return;
  }

  NSArray<PKPass *> *passes = self.passes;
  NSArray<NSNumber *> *alreadyPresent = self.passesAlreadyInLibrary;
  BOOL allNewlyAdded = passes.count > 0;
  for (NSUInteger index = 0; index < passes.count; index++) {
    BOOL wasAlreadyPresent = index < alreadyPresent.count && [alreadyPresent[index] boolValue];
    if (wasAlreadyPresent || !self.containsPassProvider(passes[index])) {
      allNewlyAdded = NO;
      break;
    }
  }

  [self resolvePendingWithOutcome:allNewlyAdded];
  if (hasListeners) {
    [self sendEventWithName:@"AddPassCompleted" body:@(allNewlyAdded)];
  }
}

#pragma mark - Presentation delegates

- (void)addPassesViewControllerDidFinish:(PKAddPassesViewController *)controller {
  [controller dismissViewControllerAnimated:YES completion:^{
    [self finishAndResolve];
  }];
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController {
  [self finishAndResolve];
}

- (void)invalidate {
  [self rejectPending:@"ERR_WALLET_UNKNOWN"
              message:@"WalletKit module was invalidated before the Apple Wallet result was received"
                error:nil];
  [super invalidate];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeWalletKitSpecJSI>(params);
}
#endif

@end
