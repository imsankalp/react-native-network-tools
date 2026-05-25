#import "NetworkToolsStorage.h"

static const NSInteger kNTMaxRequests = 100;

@implementation NetworkToolsStorage {
  NSMutableArray<NSDictionary *> *_requests;
  NSLock *_lock;
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
  }
  return self;
}

- (void)addRequest:(NSDictionary *)request {
  [_lock lock];
  [_requests addObject:request];
  while ((NSInteger)_requests.count > kNTMaxRequests) {
    [_requests removeObjectAtIndex:0];
  }
  [_lock unlock];
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
