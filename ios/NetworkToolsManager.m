#import "NetworkToolsManager.h"
#import "NetworkToolsInterceptor.h"
#import <React/RCTEventEmitter.h>

static NSString *const kNTEventName = @"NetworkTools:onRequest";

@implementation NetworkToolsManager {
  __weak RCTEventEmitter *_emitter;
}

+ (instancetype)shared {
  static NetworkToolsManager *instance = nil;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    instance = [[self alloc] init];
  });
  return instance;
}

+ (void)activate {
#if DEBUG
  [NSURLProtocol registerClass:[NetworkToolsInterceptor class]];
  // Swizzle NSURLSessionConfiguration.protocolClasses so that React Native's
  // internal sessions (which snapshot the protocol list at session creation
  // time) also include NetworkToolsInterceptor.
  [NetworkToolsInterceptor swizzleSessionConfiguration];
#endif
}

- (void)setEmitter:(nullable id)emitter {
  _emitter = emitter;
}

- (void)emitRequest:(NSDictionary *)requestDict {
#if DEBUG
  RCTEventEmitter *emitter = _emitter;
  if (emitter == nil) return;
  [emitter sendEventWithName:kNTEventName body:requestDict];
#endif
}

@end
