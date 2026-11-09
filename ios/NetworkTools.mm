#import "NetworkTools.h"
#import "NetworkToolsStorage.h"
#import "NetworkToolsManager.h"
#import "NetworkToolsSessionRecorder.h"
#import "NetworkToolsSessionStore.h"

static NSString *NTJSONString(id _Nullable object, NSString *fallback) {
  if (!object) return fallback;
  NSData *data = [NSJSONSerialization dataWithJSONObject:object options:0 error:nil];
  if (!data) return fallback;
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] ?: fallback;
}

static BOOL NTSessionsAvailable(void) {
  return [NetworkToolsManager shared].isCaptureActive;
}

@implementation NetworkTools {
  BOOL _hasListeners;
}

RCT_EXPORT_MODULE(NetworkTools)

#pragma mark - RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents {
  return @[@"NetworkTools:onRequest", @"NetworkTools:onSessionChange"];
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

- (void)setMaxBodyCaptureBytes:(double)bytes {
  [NetworkToolsManager shared].maxBodyCaptureBytes = (NSInteger)bytes;
}

- (void)setRedactHeaders:(NSArray<NSString *> *)headers {
  NSMutableSet<NSString *> *lower = [NSMutableSet setWithCapacity:headers.count];
  for (NSString *h in headers) {
    [lower addObject:h.lowercaseString];
  }
  [NetworkToolsManager shared].redactHeaderNames = [lower copy];
}

- (void)setMaxRequests:(double)max {
  [NetworkToolsStorage shared].maxRequests = (NSInteger)max;
}

- (NSNumber *)isCaptureActive {
  return @(NTSessionsAvailable());
}

#pragma mark - Sessions
// Every session method is inert unless capture was activated (debug builds only).

- (NSString *)startSession {
  if (!NTSessionsAvailable()) return @"";
  return NTJSONString([[NetworkToolsSessionRecorder shared] start], @"");
}

- (void)stopSession:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  if (!NTSessionsAvailable()) {
    resolve(@"");
    return;
  }
  [[NetworkToolsSessionRecorder shared] stopWithCompletion:^(NSDictionary *entry) {
    resolve(NTJSONString(entry, @""));
  }];
}

- (NSString *)getActiveSession {
  if (!NTSessionsAvailable()) return @"";
  return NTJSONString([[NetworkToolsSessionRecorder shared] activeSession], @"");
}

- (NSString *)getActiveSessionSummaries {
  if (!NTSessionsAvailable()) return @"[]";
  return NTJSONString([[NetworkToolsSessionRecorder shared] activeSummaries], @"[]");
}

- (void)listSessions:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  if (!NTSessionsAvailable()) {
    resolve(@"[]");
    return;
  }
  [[NetworkToolsSessionStore shared] listSessions:^(id result) {
    resolve(NTJSONString(result, @"[]"));
  }];
}

- (void)getSessionSummaries:(NSString *)sessionId
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  if (!NTSessionsAvailable()) {
    resolve(@"[]");
    return;
  }
  [[NetworkToolsSessionStore shared] summariesForSessionId:sessionId completion:^(id result) {
    resolve(NTJSONString(result, @"[]"));
  }];
}

- (void)getSessionRequest:(NSString *)sessionId
                requestId:(NSString *)requestId
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
  if (!NTSessionsAvailable()) {
    resolve(@"");
    return;
  }
  [[NetworkToolsSessionStore shared] requestForSessionId:sessionId
                                               requestId:requestId
                                              completion:^(id result) {
    resolve(NTJSONString(result, @""));
  }];
}

- (void)deleteSession:(NSString *)sessionId
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
  if (!NTSessionsAvailable()) {
    resolve(nil);
    return;
  }
  [[NetworkToolsSessionStore shared] deleteSessionId:sessionId completion:^{
    resolve(nil);
  }];
}

- (void)clearSessions:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  if (!NTSessionsAvailable()) {
    resolve(nil);
    return;
  }
  [[NetworkToolsSessionStore shared] clearSessions:^{
    resolve(nil);
  }];
}

// addListener / removeListeners are inherited from RCTEventEmitter and satisfy
// the NativeNetworkToolsSpec protocol — no override needed.

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeNetworkToolsSpecJSI>(params);
}

@end
