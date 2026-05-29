#import <React/RCTEventEmitter.h>
#import <NetworkToolsSpec/NetworkToolsSpec.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * React Native TurboModule that bridges NetworkTools storage to JavaScript.
 * Extends RCTEventEmitter so "NetworkTools:onRequest" events flow through the
 * standard RN DeviceEventEmitter on both old-arch (bridge) and new-arch (JSI).
 */
@interface NetworkTools : RCTEventEmitter <NativeNetworkToolsSpec>

@end

NS_ASSUME_NONNULL_END
