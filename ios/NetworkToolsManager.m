#import "NetworkToolsManager.h"
#import "NetworkToolsInterceptor.h"

static NSString *const kNTEventName = @"NetworkTools:onRequest";

@implementation NetworkToolsManager {
  __weak id _emitter;
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
#endif
}

- (void)setEmitter:(nullable id)emitter {
  _emitter = emitter;
}

- (void)emitRequest:(NSDictionary *)requestDict {
#if DEBUG
  id emitter = _emitter;
  if (emitter == nil) return;
  if ([emitter respondsToSelector:@selector(sendEventWithName:body:)]) {
    [emitter sendEventWithName:kNTEventName body:requestDict];
  }
#endif
}

@end
