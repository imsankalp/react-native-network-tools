#import "NetworkToolsManager.h"
#import "NetworkToolsInterceptor.h"
#import <React/RCTEventEmitter.h>

static NSString *const kNTEventName = @"NetworkTools:onRequest";

@implementation NetworkToolsManager {
  __weak RCTEventEmitter *_emitter;
  BOOL _captureActive;
}

+ (instancetype)shared {
  static NetworkToolsManager *instance = nil;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    instance = [[self alloc] init];
    instance->_maxBodyCaptureBytes = 256 * 1024;
    instance->_redactHeaderNames = [NSSet set];
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
  [self shared]->_captureActive = YES;
#endif
}

- (BOOL)isCaptureActive {
  return _captureActive;
}

- (void)setEmitter:(nullable id)emitter {
  _emitter = emitter;
}

- (void)emitRequest:(NSDictionary *)requestDict {
  [self emitEvent:kNTEventName body:requestDict];
}

- (void)emitEvent:(NSString *)name body:(NSDictionary *)body {
#if DEBUG
  RCTEventEmitter *emitter = _emitter;
  if (emitter == nil) return;
  [emitter sendEventWithName:name body:body];
#endif
}

@end
