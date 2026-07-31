#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <PassKit/PassKit.h>

@interface RCTConvert (PassKit)

+ (PKAddPassButtonStyle)PKAddPassButtonStyle: (NSNumber *)style;

@end

@implementation RCTConvert(PassKit)

+ (PKAddPassButtonStyle)PKAddPassButtonStyle: (NSNumber *)style {
    return [style intValue] == 0
        ? PKAddPassButtonStyleBlack
        : PKAddPassButtonStyleBlackOutline;
}

@end
