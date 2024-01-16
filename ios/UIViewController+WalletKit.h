#import <UIKit/UIKit.h>
#import <React/RCTUtils.h>

@interface UIViewController (WalletKit)

+ (UIViewController *)topController;

@end

@implementation UIViewController (WalletKit)

+ (UIViewController *)topController {
    UIViewController *topController = [UIViewController topMostMainVC];
    if ([topController isKindOfClass:[UINavigationController class]]) {
        topController = topController.childViewControllers.firstObject;
    }
    return topController;
}

+ (UIViewController *)topMostMainVC {
    UIApplication *sharedApplication = RCTSharedApplication();
    UIWindow *mainWindow = sharedApplication.delegate.window;
    return [UIViewController topMostController:mainWindow];
}

+ (UIViewController *)topMostController:(UIWindow *)window {
    UIViewController *topController = window.rootViewController;
    while (topController.presentedViewController) {
        topController = topController.presentedViewController;
        if ([topController isKindOfClass:[UINavigationController class]]) {
            topController = [(UINavigationController *)topController viewControllers].firstObject;
        }
    }
    return topController;
}

@end

