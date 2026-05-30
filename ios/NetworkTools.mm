#import "NetworkTools.h"
#import "NetworkToolsStorage.h"
#import "NetworkToolsManager.h"

@implementation NetworkTools {
  BOOL _hasListeners;
}

RCT_EXPORT_MODULE(NetworkTools)

#pragma mark - RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents {
  return @[@"NetworkTools:onRequest"];
}

- (void)startObserving {
  _hasListeners = YES;
}

- (void)stopObserving {
  _hasListeners = NO;
}

#pragma mark - Module lifecycle

- (instancetype)init {
  if (self = [super init]) {
    [[NetworkToolsManager shared] setEmitter:self];
  }
  return self;
}

- (void)invalidate {
  [[NetworkToolsManager shared] setEmitter:nil];
  [super invalidate];
}

#pragma mark - NativeNetworkToolsSpec

- (NSString *)getAllRequests {
  NSArray *requests = [[NetworkToolsStorage shared] allRequests];
  NSError *err = nil;
  NSData *data = [NSJSONSerialization dataWithJSONObject:requests options:0 error:&err];
  if (!data) return @"[]";
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] ?: @"[]";
}

- (NSString *)getRequestById:(NSString *)requestId {
  NSDictionary *request = [[NetworkToolsStorage shared] requestById:requestId];
  if (!request) return @"{}";
  NSError *err = nil;
  NSData *data = [NSJSONSerialization dataWithJSONObject:request options:0 error:&err];
  if (!data) return @"{}";
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] ?: @"{}";
}

- (void)clearAllRequests {
  [[NetworkToolsStorage shared] clearAll];
}

- (NSNumber *)getRequestCount {
  return @([[NetworkToolsStorage shared] count]);
}

// addListener / removeListeners are inherited from RCTEventEmitter and satisfy
// the NativeNetworkToolsSpec protocol — no override needed.

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeNetworkToolsSpecJSI>(params);
}

@end
