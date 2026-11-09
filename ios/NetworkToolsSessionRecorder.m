#import "NetworkToolsSessionRecorder.h"
#import "NetworkToolsManager.h"
#import "NetworkToolsSessionReader.h"
#import "NetworkToolsSessionStore.h"
#import "NetworkToolsStorage.h"

#define NT_STRINGIFY(x) #x
#define NT_XSTRINGIFY(x) NT_STRINGIFY(x)
#ifdef NT_LIBRARY_VERSION
static NSString *const kNTLibraryVersion = @NT_XSTRINGIFY(NT_LIBRARY_VERSION);
#else
static NSString *const kNTLibraryVersion = @"unknown";
#endif

@implementation NetworkToolsSessionRecorder {
  NSLock *_lock;
  NSString *_sessionId;
  NSString *_name;
  double _startTime;
  NSMutableArray<NSDictionary *> *_requests;
  BOOL _limitReached;
}

+ (instancetype)shared {
  static NetworkToolsSessionRecorder *instance = nil;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    instance = [[self alloc] init];
  });
  return instance;
}

- (instancetype)init {
  if (self = [super init]) {
    _lock = [[NSLock alloc] init];
  }
  return self;
}

#pragma mark - Lifecycle

- (nullable NSDictionary *)start {
  if (![NetworkToolsManager shared].isCaptureActive) return nil;

  [_lock lock];
  if (_sessionId) {
    [_lock unlock];
    return nil;
  }
  NSDate *now = [NSDate date];
  _sessionId = [[NSUUID UUID] UUIDString];
  _name = [@"api-recording-" stringByAppendingString:[[self nameFormatter] stringFromDate:now]];
  _startTime = now.timeIntervalSince1970 * 1000.0;
  _requests = [NSMutableArray array];
  _limitReached = NO;
  NSDictionary *active = [self activeSessionLocked];
  [_lock unlock];

  [self emitType:@"started" active:active added:nil];
  return active;
}

- (void)stopWithCompletion:(void (^)(NSDictionary *_Nullable))completion {
  [_lock lock];
  if (!_sessionId) {
    [_lock unlock];
    completion(nil);
    return;
  }
  NSArray<NSDictionary *> *requests = [_requests copy];
  NSDictionary *entry = @{
    @"id": _sessionId,
    @"name": _name,
    @"status": @"stopped",
    @"startTime": @(_startTime),
    @"endTime": @([NSDate date].timeIntervalSince1970 * 1000.0),
    @"requestCount": @(requests.count),
    @"limitReached": @(_limitReached),
    @"platform": @"ios",
    @"appId": NSBundle.mainBundle.bundleIdentifier ?: @"",
    @"appVersion": [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"] ?: @"",
    @"libraryVersion": kNTLibraryVersion,
  };
  _sessionId = nil;
  _name = nil;
  _requests = nil;
  _limitReached = NO;
  [_lock unlock];

  [self emitType:@"stopped" active:nil added:nil];
  [[NetworkToolsSessionStore shared] saveSessionEntry:entry requests:requests completion:completion];
}

- (void)recordRequest:(NSDictionary *)request {
  [_lock lock];
  if (!_sessionId || [request[@"requestTime"] doubleValue] < _startTime) {
    [_lock unlock];
    return;
  }

  if ((NSInteger)_requests.count >= [NetworkToolsStorage shared].maxRequests) {
    BOOL firstHit = !_limitReached;
    _limitReached = YES;
    NSDictionary *active = [self activeSessionLocked];
    [_lock unlock];
    if (firstHit) [self emitType:@"limitReached" active:active added:nil];
    return;
  }

  NSMutableDictionary *line = [request mutableCopy];
  line[@"seq"] = @(_requests.count + 1);
  [_requests addObject:line];
  NSDictionary *active = [self activeSessionLocked];
  [_lock unlock];

  [self emitType:@"request" active:active added:[NetworkToolsSessionReader summaryForRequest:line]];
}

#pragma mark - Reads

- (nullable NSDictionary *)activeSession {
  [_lock lock];
  NSDictionary *active = [self activeSessionLocked];
  [_lock unlock];
  return active;
}

- (NSArray<NSDictionary *> *)activeSummaries {
  [_lock lock];
  NSArray *requests = [_requests copy] ?: @[];
  [_lock unlock];
  NSMutableArray *summaries = [NSMutableArray arrayWithCapacity:requests.count];
  for (NSDictionary *request in requests) {
    [summaries addObject:[NetworkToolsSessionReader summaryForRequest:request]];
  }
  return summaries;
}

#pragma mark - Helpers

- (nullable NSDictionary *)activeSessionLocked {
  if (!_sessionId) return nil;
  return @{
    @"id": _sessionId,
    @"name": _name,
    @"status": @"recording",
    @"startTime": @(_startTime),
    @"requestCount": @(_requests.count),
    @"limitReached": @(_limitReached),
  };
}

- (void)emitType:(NSString *)type active:(nullable NSDictionary *)active added:(nullable NSDictionary *)added {
  NSMutableDictionary *body = [NSMutableDictionary dictionary];
  body[@"type"] = type;
  body[@"activeSession"] = active ?: [NSNull null];
  if (added) body[@"addedRequest"] = added;
  [[NetworkToolsManager shared] emitEvent:@"NetworkTools:onSessionChange" body:body];
}

- (NSDateFormatter *)nameFormatter {
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
  formatter.timeZone = [NSTimeZone localTimeZone];
  formatter.dateFormat = @"yyyy-MM-dd'T'HH-mm-ss";
  return formatter;
}

@end
