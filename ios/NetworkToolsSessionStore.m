#import "NetworkToolsSessionStore.h"
#import "NetworkToolsSessionReader.h"

const NSInteger NTMaxStoredSessions = 20;

@implementation NetworkToolsSessionStore {
  dispatch_queue_t _queue;
  BOOL _prepared;
}

+ (instancetype)shared {
  static NetworkToolsSessionStore *instance = nil;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    instance = [[self alloc] init];
  });
  return instance;
}

- (instancetype)init {
  if (self = [super init]) {
    _queue = dispatch_queue_create("com.networktools.sessions", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

#pragma mark - Public

- (void)saveSessionEntry:(NSDictionary *)entry
                requests:(NSArray<NSDictionary *> *)requests
              completion:(NTSessionResultBlock)completion {
  [self run:^{
    if (![self ensureDirectory]) {
      completion(nil);
      return;
    }

    NSMutableData *file = [NSMutableData data];
    for (NSDictionary *request in requests) {
      NSData *line = [NSJSONSerialization dataWithJSONObject:request options:0 error:nil];
      if (!line) continue;
      [file appendData:line];
      [file appendBytes:"\n" length:1];
    }

    NSString *sessionId = entry[@"id"];
    if (![file writeToURL:[NetworkToolsSessionReader fileURLForSessionId:sessionId]
                  options:NSDataWritingAtomic
                    error:nil]) {
      completion(nil);
      return;
    }

    NSMutableDictionary *stored = [entry mutableCopy];
    stored[@"sizeBytes"] = @(file.length);
    stored[@"schemaVersion"] = @(NTSessionSchemaVersion);

    NSMutableArray *sessions = [[self indexSessions] mutableCopy];
    [sessions addObject:stored];
    [self writeIndexApplyingRetention:sessions];
    completion(stored);
  }];
}

- (void)listSessions:(NTSessionResultBlock)completion {
  [self run:^{
    completion([self indexSessions]);
  }];
}

- (void)summariesForSessionId:(NSString *)sessionId completion:(NTSessionResultBlock)completion {
  [self run:^{
    NSArray<NSDictionary *> *requests = [self readRequestsDroppingUnreadable:sessionId];
    if (!requests) {
      completion(nil);
      return;
    }
    NSMutableArray *summaries = [NSMutableArray arrayWithCapacity:requests.count];
    for (NSDictionary *request in requests) {
      [summaries addObject:[NetworkToolsSessionReader summaryForRequest:request]];
    }
    completion(summaries);
  }];
}

- (void)requestForSessionId:(NSString *)sessionId
                  requestId:(NSString *)requestId
                 completion:(NTSessionResultBlock)completion {
  [self run:^{
    for (NSDictionary *request in [self readRequestsDroppingUnreadable:sessionId]) {
      if ([request[@"id"] isEqual:requestId]) {
        completion(request);
        return;
      }
    }
    completion(nil);
  }];
}

- (void)deleteSessionId:(NSString *)sessionId completion:(dispatch_block_t)completion {
  [self run:^{
    [self removeSessionIds:[NSSet setWithObject:sessionId]];
    completion();
  }];
}

- (void)clearSessions:(dispatch_block_t)completion {
  [self run:^{
    [[NSFileManager defaultManager] removeItemAtURL:[NetworkToolsSessionReader sessionsDirectory]
                                              error:nil];
    completion();
  }];
}

#pragma mark - Queue

- (void)run:(dispatch_block_t)block {
  dispatch_async(_queue, ^{
    if (!self->_prepared) {
      self->_prepared = YES;
      [self housekeep];
    }
    block();
  });
}

#pragma mark - Index (queue only)

- (NSArray<NSDictionary *> *)indexSessions {
  NSArray *sessions = [NetworkToolsSessionReader readIndex][@"sessions"];
  return [sessions isKindOfClass:[NSArray class]] ? sessions : @[];
}

- (void)writeIndexApplyingRetention:(NSArray<NSDictionary *> *)sessions {
  NSArray *sorted = [sessions sortedArrayUsingComparator:^NSComparisonResult(NSDictionary *a, NSDictionary *b) {
    return [b[@"startTime"] compare:a[@"startTime"]];
  }];
  NSArray *kept = sorted.count > (NSUInteger)NTMaxStoredSessions
    ? [sorted subarrayWithRange:NSMakeRange(0, (NSUInteger)NTMaxStoredSessions)]
    : sorted;

  [self ensureDirectory];
  NSDictionary *index = @{ @"schemaVersion": @(NTSessionSchemaVersion), @"sessions": kept };
  NSData *data = [NSJSONSerialization dataWithJSONObject:index options:0 error:nil];
  [data writeToURL:[NetworkToolsSessionReader indexURL] options:NSDataWritingAtomic error:nil];

  for (NSUInteger i = kept.count; i < sorted.count; i++) {
    [[NSFileManager defaultManager] removeItemAtURL:
     [NetworkToolsSessionReader fileURLForSessionId:sorted[i][@"id"]] error:nil];
  }
}

- (void)removeSessionIds:(NSSet<NSString *> *)ids {
  NSMutableArray *remaining = [NSMutableArray array];
  for (NSDictionary *session in [self indexSessions]) {
    if (![ids containsObject:session[@"id"]]) [remaining addObject:session];
  }
  [self writeIndexApplyingRetention:remaining];
  for (NSString *sessionId in ids) {
    [[NSFileManager defaultManager] removeItemAtURL:
     [NetworkToolsSessionReader fileURLForSessionId:sessionId] error:nil];
  }
}

- (nullable NSArray<NSDictionary *> *)readRequestsDroppingUnreadable:(NSString *)sessionId {
  NSArray<NSDictionary *> *requests = [NetworkToolsSessionReader readRequestsForSessionId:sessionId];
  if (!requests) {
    [self removeSessionIds:[NSSet setWithObject:sessionId]];
  }
  return requests;
}

#pragma mark - Housekeeping (queue only)

- (void)housekeep {
  NSFileManager *fm = [NSFileManager defaultManager];
  NSURL *dir = [NetworkToolsSessionReader sessionsDirectory];
  if (![fm fileExistsAtPath:dir.path]) return;

  NSDictionary *index = [NetworkToolsSessionReader readIndex];
  if (![index[@"schemaVersion"] isEqual:@(NTSessionSchemaVersion)]) {
    [fm removeItemAtURL:dir error:nil];
    return;
  }

  NSMutableSet<NSString *> *listed = [NSMutableSet set];
  NSMutableArray *present = [NSMutableArray array];
  for (NSDictionary *session in [self indexSessions]) {
    NSString *sessionId = session[@"id"];
    if (![sessionId isKindOfClass:[NSString class]]) continue;
    if ([fm isReadableFileAtPath:[NetworkToolsSessionReader fileURLForSessionId:sessionId].path]) {
      [listed addObject:sessionId];
      [present addObject:session];
    }
  }
  if (present.count != [self indexSessions].count) {
    [self writeIndexApplyingRetention:present];
  }

  for (NSURL *url in [fm contentsOfDirectoryAtURL:dir includingPropertiesForKeys:nil options:0 error:nil]) {
    if ([url.pathExtension isEqualToString:@"ndjson"] &&
        ![listed containsObject:url.lastPathComponent.stringByDeletingPathExtension]) {
      [fm removeItemAtURL:url error:nil];
    }
  }
}

- (BOOL)ensureDirectory {
  NSURL *dir = [NetworkToolsSessionReader sessionsDirectory];
  if (![[NSFileManager defaultManager] createDirectoryAtURL:dir
                                withIntermediateDirectories:YES
                                                 attributes:nil
                                                      error:nil]) {
    return NO;
  }
  NSURL *root = [dir URLByDeletingLastPathComponent];
  [root setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil];
  return YES;
}

@end
