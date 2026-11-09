#import "NetworkToolsStorage.h"

static const NSInteger kNTDefaultMaxRequests = 1000;

@implementation NetworkToolsStorage {
  NSMutableArray<NSDictionary *> *_requests;
  NSLock *_lock;
  NSInteger _maxRequests;
}

+ (instancetype)shared {
  static NetworkToolsStorage *instance = nil;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    instance = [[self alloc] init];
  });
  return instance;
}

- (instancetype)init {
  if (self = [super init]) {
    _requests = [NSMutableArray array];
    _lock = [[NSLock alloc] init];
    _maxRequests = kNTDefaultMaxRequests;
  }
  return self;
}

- (NSInteger)maxRequests {
  [_lock lock];
  NSInteger value = _maxRequests;
  [_lock unlock];
  return value;
}

- (void)setMaxRequests:(NSInteger)maxRequests {
  [_lock lock];
  _maxRequests = MAX(maxRequests, 1);
  [self trimLocked];
  [_lock unlock];
}

- (void)addRequest:(NSDictionary *)request {
  [_lock lock];
  [_requests addObject:request];
  [self trimLocked];
  [_lock unlock];
}

- (void)trimLocked {
  NSInteger overflow = (NSInteger)_requests.count - _maxRequests;
  if (overflow > 0) {
    [_requests removeObjectsInRange:NSMakeRange(0, (NSUInteger)overflow)];
  }
}

- (NSArray<NSDictionary *> *)allRequests {
  [_lock lock];
  NSArray *snapshot = [_requests copy];
  [_lock unlock];
  return snapshot;
}

- (nullable NSDictionary *)requestById:(NSString *)requestId {
  [_lock lock];
  NSDictionary *found = nil;
  for (NSDictionary *req in _requests) {
    if ([req[@"id"] isEqualToString:requestId]) {
      found = req;
      break;
    }
  }
  [_lock unlock];
  return found;
}

- (void)clearAll {
  [_lock lock];
  [_requests removeAllObjects];
  [_lock unlock];
}

- (NSInteger)count {
  [_lock lock];
  NSInteger c = (NSInteger)_requests.count;
  [_lock unlock];
  return c;
}

@end
