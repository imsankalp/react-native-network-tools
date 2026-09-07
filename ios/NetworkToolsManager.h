#import <Foundation/Foundation.h>

@class RCTEventEmitter;

NS_ASSUME_NONNULL_BEGIN

/**
 * Singleton that owns activation and event emission for NetworkTools on iOS.
 * Mirrors Android's NetworkToolsManager.kt.
 *
 * Call +activate in AppDelegate wrapped in #if DEBUG:
 *
 *   #if DEBUG
 *   [NetworkToolsManager activate];
 *   #endif
 */
@interface NetworkToolsManager : NSObject

@property (class, nonatomic, readonly) NetworkToolsManager *shared;

/** Maximum bytes captured per request/response body. Default: 256 KB. */
@property (nonatomic, assign) NSInteger maxBodyCaptureBytes;

/**
 * Case-insensitive set of header names whose values will be replaced with
 * "[redacted]" before the request is stored and emitted. Updated at runtime
 * via the setRedactHeaders TurboModule method.
 */
@property (nonatomic, copy) NSSet<NSString *> *redactHeaderNames;

/**
 * Registers the URLProtocol interceptor. No-op in release builds — the entire
 * method body is compiled out with #if DEBUG.
 */
+ (void)activate;

/**
 * Called by the native module to hand over its RCTEventEmitter reference so
 * the interceptor can emit events to JavaScript.
 */
- (void)setEmitter:(nullable RCTEventEmitter *)emitter;

/**
 * Emits a captured request dictionary as a "NetworkTools:onRequest" event.
 * No-op if no emitter is registered or in release builds.
 */
- (void)emitRequest:(NSDictionary *)requestDict;

@end

NS_ASSUME_NONNULL_END
