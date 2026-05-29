#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * URLProtocol subclass that intercepts all HTTP/HTTPS requests made through
 * URLSession, which is the transport layer React Native's fetch/XMLHttpRequest
 * uses on iOS. Mirrors Android's NetworkToolsInterceptor.kt.
 *
 * Registered via +[NetworkToolsManager activate] — only in DEBUG builds.
 */
@interface NetworkToolsInterceptor : NSURLProtocol

/**
 * Swizzles NSURLSessionConfiguration.protocolClasses so that every session
 * created after +activate (including React Native's internal sessions) will
 * have NetworkToolsInterceptor injected at the front of the protocol list.
 * Called automatically by +[NetworkToolsManager activate].
 */
+ (void)swizzleSessionConfiguration;

@end

NS_ASSUME_NONNULL_END
