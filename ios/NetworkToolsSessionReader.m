#import "NetworkToolsSessionReader.h"

const NSInteger NTSessionSchemaVersion = 1;

@implementation NetworkToolsSessionReader

+ (NSURL *)sessionsDirectory {
  NSURL *support = [[NSFileManager defaultManager] URLsForDirectory:NSApplicationSupportDirectory
                                                          inDomains:NSUserDomainMask].firstObject;
  return [[support URLByAppendingPathComponent:@"network-tools" isDirectory:YES]
          URLByAppendingPathComponent:@"sessions" isDirectory:YES];
}

+ (NSURL *)indexURL {
  return [[self sessionsDirectory] URLByAppendingPathComponent:@"index.json"];
}

+ (NSURL *)fileURLForSessionId:(NSString *)sessionId {
  NSString *safeId = [sessionId lastPathComponent];
  return [[self sessionsDirectory] URLByAppendingPathComponent:
          [safeId stringByAppendingPathExtension:@"ndjson"]];
}

+ (nullable NSDictionary *)readIndex {
  NSData *data = [NSData dataWithContentsOfURL:[self indexURL]];
  if (!data) return nil;
  id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  return [json isKindOfClass:[NSDictionary class]] ? json : nil;
}

+ (nullable NSArray<NSDictionary *> *)readRequestsForSessionId:(NSString *)sessionId {
  NSData *data = [NSData dataWithContentsOfURL:[self fileURLForSessionId:sessionId]];
  if (!data) return nil;
  NSString *text = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  if (!text) return nil;

  NSMutableArray<NSDictionary *> *requests = [NSMutableArray array];
  for (NSString *line in [text componentsSeparatedByString:@"\n"]) {
    if (line.length == 0) continue;
    NSData *lineData = [line dataUsingEncoding:NSUTF8StringEncoding];
    id json = [NSJSONSerialization JSONObjectWithData:lineData options:0 error:nil];
    if ([json isKindOfClass:[NSDictionary class]]) {
      [requests addObject:json];
    }
  }
  return requests;
}

+ (NSDictionary *)summaryForRequest:(NSDictionary *)request {
  NSMutableDictionary *summary = [NSMutableDictionary dictionary];
  for (NSString *key in @[@"id", @"seq", @"method", @"url", @"responseCode",
                          @"duration", @"requestTime", @"error"]) {
    if (request[key]) summary[key] = request[key];
  }
  return summary;
}

@end
