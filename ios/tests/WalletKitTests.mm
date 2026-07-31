#import <XCTest/XCTest.h>

#import "WalletKit.h"

#import <PassKit/PassKit.h>

@interface WalletKit (Testing)
@property(nonatomic, copy) BOOL (^availabilityProvider)(void);
@property(nonatomic, copy) PKPass * _Nullable (^passFactory)(NSData *, NSError **);
@property(nonatomic, copy) PKAddPassesViewController * _Nullable (^singleControllerFactory)(PKPass *);
@property(nonatomic, copy) PKAddPassesViewController * _Nullable (^multipleControllerFactory)(NSArray<PKPass *> *);
@property(nonatomic, copy) UIViewController * _Nullable (^presenterProvider)(void);
@property(nonatomic, copy) BOOL (^containsPassProvider)(PKPass *);
- (void)canAddPasses:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)addPass:(NSString *)passData
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject;
- (void)addPasses:(NSArray<NSString *> *)passDataArray
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject;
- (void)addPassesViewControllerDidFinish:(PKAddPassesViewController *)controller;
- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController;
@end

@interface WalletKitPromiseRecorder : NSObject
@property(nonatomic, strong) id resolvedValue;
@property(nonatomic, copy) NSString *rejectedCode;
@property(nonatomic, copy) NSString *rejectedMessage;
@property(nonatomic, strong) NSError *rejectedError;
@property(nonatomic) NSUInteger settlementCount;
- (RCTPromiseResolveBlock)resolveBlock;
- (RCTPromiseRejectBlock)rejectBlock;
@end

@implementation WalletKitPromiseRecorder
- (RCTPromiseResolveBlock)resolveBlock {
  return ^(id value) {
    self.resolvedValue = value;
    self.settlementCount += 1;
  };
}

- (RCTPromiseRejectBlock)rejectBlock {
  return ^(NSString *code, NSString *message, NSError *error) {
    self.rejectedCode = code;
    self.rejectedMessage = message;
    self.rejectedError = error;
    self.settlementCount += 1;
  };
}
@end

@interface WalletKitTestView : UIView
@property(nonatomic, strong) UIWindow *testWindow;
@end

@implementation WalletKitTestView
- (UIWindow *)window {
  return self.testWindow;
}
@end

@class WalletKitTestController;

@interface WalletKitTestPresenter : UIViewController
@property(nonatomic, strong) WalletKitTestController *lastPresentedController;
@property(nonatomic) BOOL failPresentation;
@property(nonatomic) BOOL throwDuringPresentation;
@property(nonatomic, strong) UIWindow *testWindow;
@end

@interface WalletKitTestController : UIViewController
@property(nonatomic, weak) id<PKAddPassesViewControllerDelegate> delegate;
@property(nonatomic, weak) UIViewController *testPresentingViewController;
@property(nonatomic, strong) UIPresentationController *testPresentationController;
@property(nonatomic) NSUInteger dismissalCount;
@end

@implementation WalletKitTestController
- (UIViewController *)presentingViewController {
  return self.testPresentingViewController;
}

- (UIPresentationController *)presentationController {
  if (self.testPresentationController == nil) {
    self.testPresentationController = [[UIPresentationController alloc]
      initWithPresentedViewController:self
             presentingViewController:self.testPresentingViewController];
  }
  return self.testPresentationController;
}

- (void)dismissViewControllerAnimated:(BOOL)flag completion:(void (^)(void))completion {
  self.dismissalCount += 1;
  if (completion != nil) {
    completion();
  }
}
@end

@implementation WalletKitTestPresenter
- (instancetype)init {
  self = [super init];
  if (self) {
    _testWindow = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 320, 640)];
    WalletKitTestView *view = [[WalletKitTestView alloc] initWithFrame:_testWindow.bounds];
    view.testWindow = _testWindow;
    self.view = view;
  }
  return self;
}

- (void)presentViewController:(UIViewController *)viewControllerToPresent
                     animated:(BOOL)flag
                   completion:(void (^)(void))completion {
  if (self.throwDuringPresentation) {
    [NSException raise:@"WalletKitTestPresentation" format:@"Presentation failed"];
  }
  WalletKitTestController *controller = (WalletKitTestController *)viewControllerToPresent;
  self.lastPresentedController = controller;
  if (!self.failPresentation) {
    controller.testPresentingViewController = self;
  }
  if (completion != nil) {
    completion();
  }
}
@end

@interface WalletKitTests : XCTestCase
@property(nonatomic, strong) WalletKit *module;
@property(nonatomic, strong) WalletKitTestController *controller;
@property(nonatomic, strong) WalletKitTestPresenter *presenter;
@property(nonatomic, strong) PKPass *testPass;
@end

@implementation WalletKitTests

- (void)setUp {
  [super setUp];
  self.module = [WalletKit new];
  self.controller = [WalletKitTestController new];
  self.presenter = [WalletKitTestPresenter new];
  self.testPass = (PKPass *)[NSObject new];

  PKPass *pass = self.testPass;
  WalletKitTestController *controller = self.controller;
  WalletKitTestPresenter *presenter = self.presenter;
  self.module.availabilityProvider = ^BOOL { return YES; };
  self.module.passFactory = ^PKPass *(NSData *data, NSError **error) { return pass; };
  self.module.singleControllerFactory = ^PKAddPassesViewController *(PKPass *value) {
    return (PKAddPassesViewController *)controller;
  };
  self.module.multipleControllerFactory = ^PKAddPassesViewController *(NSArray<PKPass *> *values) {
    return (PKAddPassesViewController *)controller;
  };
  self.module.presenterProvider = ^UIViewController * { return presenter; };
  self.module.containsPassProvider = ^BOOL(PKPass *value) { return NO; };
}

- (void)tearDown {
  [self.module invalidate];
  self.module = nil;
  [super tearDown];
}

- (void)testCanAddPassesUsesAvailabilityProvider {
  self.module.availabilityProvider = ^BOOL { return NO; };
  WalletKitPromiseRecorder *recorder = [WalletKitPromiseRecorder new];

  [self.module canAddPasses:recorder.resolveBlock reject:recorder.rejectBlock];

  XCTAssertEqualObjects(recorder.resolvedValue, @(NO));
  XCTAssertEqual(recorder.settlementCount, 1U);
}

- (void)testInvalidBase64RejectsBeforeCreatingPass {
  __block BOOL factoryCalled = NO;
  self.module.passFactory = ^PKPass *(NSData *data, NSError **error) {
    factoryCalled = YES;
    return nil;
  };
  WalletKitPromiseRecorder *recorder = [WalletKitPromiseRecorder new];

  [self.module addPass:@"not base64"
               resolve:recorder.resolveBlock
                reject:recorder.rejectBlock];

  XCTAssertFalse(factoryCalled);
  XCTAssertEqualObjects(recorder.rejectedCode, @"INVALID_PASS");
  XCTAssertEqual(recorder.settlementCount, 1U);
}

- (void)testLineWrappedBase64IsNormalizedBeforeStrictDecoding {
  __block NSData *receivedData = nil;
  PKPass *pass = self.testPass;
  self.module.passFactory = ^PKPass *(NSData *data, NSError **error) {
    receivedData = data;
    return pass;
  };
  WalletKitPromiseRecorder *recorder = [WalletKitPromiseRecorder new];

  [self.module addPass:@"e A\n=\t="
               resolve:recorder.resolveBlock
                reject:recorder.rejectBlock];

  XCTAssertEqualObjects(receivedData, [@"x" dataUsingEncoding:NSUTF8StringEncoding]);
  XCTAssertNil(recorder.rejectedCode);
}

- (void)testUnavailableWalletRejectsWithoutCreatingController {
  self.module.availabilityProvider = ^BOOL { return NO; };
  __block BOOL controllerFactoryCalled = NO;
  self.module.singleControllerFactory = ^PKAddPassesViewController *(PKPass *pass) {
    controllerFactoryCalled = YES;
    return nil;
  };
  WalletKitPromiseRecorder *recorder = [WalletKitPromiseRecorder new];

  [self addSinglePassWithRecorder:recorder];

  XCTAssertFalse(controllerFactoryCalled);
  XCTAssertEqualObjects(recorder.rejectedCode, @"ERR_WALLET_NOT_AVAILABLE");
}

- (void)testNilPassKitControllerRejectsAsUnavailable {
  self.module.singleControllerFactory = ^PKAddPassesViewController *(PKPass *pass) { return nil; };
  WalletKitPromiseRecorder *recorder = [WalletKitPromiseRecorder new];

  [self addSinglePassWithRecorder:recorder];

  XCTAssertEqualObjects(recorder.rejectedCode, @"ERR_WALLET_NOT_AVAILABLE");
  XCTAssertEqual(recorder.settlementCount, 1U);
}

- (void)testNilPresenterRejectsAndClearsPendingOperation {
  self.module.presenterProvider = ^UIViewController * { return nil; };
  WalletKitPromiseRecorder *first = [WalletKitPromiseRecorder new];
  [self addSinglePassWithRecorder:first];
  [self flushMainQueue];

  XCTAssertEqualObjects(first.rejectedCode, @"ERR_WALLET_UNKNOWN");
  XCTAssertTrue([first.rejectedMessage containsString:@"no active view controller"]);

  WalletKitPromiseRecorder *second = [WalletKitPromiseRecorder new];
  [self addSinglePassWithRecorder:second];
  [self flushMainQueue];
  XCTAssertNotEqualObjects(second.rejectedCode, @"ERR_WALLET_IN_PROGRESS");
}

- (void)testFailedAndThrowingPresentationRejectExactlyOnce {
  self.presenter.failPresentation = YES;
  WalletKitPromiseRecorder *failed = [WalletKitPromiseRecorder new];
  [self addSinglePassWithRecorder:failed];
  [self flushMainQueue];
  XCTAssertEqualObjects(failed.rejectedCode, @"ERR_WALLET_UNKNOWN");
  XCTAssertEqual(failed.settlementCount, 1U);

  self.presenter.failPresentation = NO;
  self.presenter.throwDuringPresentation = YES;
  WalletKitPromiseRecorder *thrown = [WalletKitPromiseRecorder new];
  [self addSinglePassWithRecorder:thrown];
  [self flushMainQueue];
  XCTAssertEqualObjects(thrown.rejectedCode, @"ERR_WALLET_UNKNOWN");
  XCTAssertNotNil(thrown.rejectedError);
  XCTAssertEqual(thrown.settlementCount, 1U);
}

- (void)testConcurrentCallIsRejectedWithoutReplacingFirstOperation {
  WalletKitPromiseRecorder *first = [WalletKitPromiseRecorder new];
  WalletKitPromiseRecorder *second = [WalletKitPromiseRecorder new];

  [self addSinglePassWithRecorder:first];
  [self addSinglePassWithRecorder:second];

  XCTAssertEqualObjects(second.rejectedCode, @"ERR_WALLET_IN_PROGRESS");
  XCTAssertEqual(first.settlementCount, 0U);
  [self flushMainQueue];
  XCTAssertEqual(first.settlementCount, 0U);
}

- (void)testDelegateCompletionResolvesTrueOnlyForNewlyAddedPasses {
  __block NSUInteger containsCalls = 0;
  self.module.containsPassProvider = ^BOOL(PKPass *pass) {
    containsCalls += 1;
    return containsCalls > 1;
  };
  WalletKitPromiseRecorder *recorder = [WalletKitPromiseRecorder new];
  [self addSinglePassWithRecorder:recorder];
  [self flushMainQueue];

  [self.module addPassesViewControllerDidFinish:(PKAddPassesViewController *)self.controller];

  XCTAssertEqualObjects(recorder.resolvedValue, @(YES));
  XCTAssertEqual(recorder.settlementCount, 1U);
  XCTAssertEqual(self.controller.dismissalCount, 1U);
}

- (void)testCancellationAndAlreadyPresentPassResolveFalse {
  WalletKitPromiseRecorder *cancelled = [WalletKitPromiseRecorder new];
  [self addSinglePassWithRecorder:cancelled];
  [self flushMainQueue];
  [self.module presentationControllerDidDismiss:self.controller.presentationController];
  XCTAssertEqualObjects(cancelled.resolvedValue, @(NO));

  self.module.containsPassProvider = ^BOOL(PKPass *pass) { return YES; };
  WalletKitPromiseRecorder *alreadyPresent = [WalletKitPromiseRecorder new];
  [self addSinglePassWithRecorder:alreadyPresent];
  [self flushMainQueue];
  [self.module addPassesViewControllerDidFinish:(PKAddPassesViewController *)self.controller];
  XCTAssertEqualObjects(alreadyPresent.resolvedValue, @(NO));
}

- (void)testMultiplePassesAndRepeatedDelegatesSettleExactlyOnce {
  __block NSUInteger containsCalls = 0;
  self.module.containsPassProvider = ^BOOL(PKPass *pass) {
    containsCalls += 1;
    return containsCalls > 2;
  };
  WalletKitPromiseRecorder *recorder = [WalletKitPromiseRecorder new];
  [self.module addPasses:@[@"eA==", @"eQ=="]
                  resolve:recorder.resolveBlock
                   reject:recorder.rejectBlock];
  [self flushMainQueue];

  [self.module addPassesViewControllerDidFinish:(PKAddPassesViewController *)self.controller];
  [self.module presentationControllerDidDismiss:self.controller.presentationController];

  XCTAssertEqualObjects(recorder.resolvedValue, @(YES));
  XCTAssertEqual(recorder.settlementCount, 1U);
}

- (void)testInvalidateRejectsPendingOperationAndIgnoresLateDismissal {
  WalletKitPromiseRecorder *recorder = [WalletKitPromiseRecorder new];
  [self addSinglePassWithRecorder:recorder];
  [self flushMainQueue];

  [self.module invalidate];
  [self.module presentationControllerDidDismiss:self.controller.presentationController];

  XCTAssertEqualObjects(recorder.rejectedCode, @"ERR_WALLET_UNKNOWN");
  XCTAssertEqual(recorder.settlementCount, 1U);
}

- (void)addSinglePassWithRecorder:(WalletKitPromiseRecorder *)recorder {
  [self.module addPass:@"eA=="
               resolve:recorder.resolveBlock
                reject:recorder.rejectBlock];
}

- (void)flushMainQueue {
  XCTestExpectation *expectation = [self expectationWithDescription:@"main queue flushed"];
  dispatch_async(dispatch_get_main_queue(), ^{
    [expectation fulfill];
  });
  [self waitForExpectations:@[expectation] timeout:2.0];
}

@end
