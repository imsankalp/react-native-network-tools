#import "NetworkToolsInterceptor.h"
#import "NetworkToolsStorage.h"
#import "NetworkToolsManager.h"
#import <objc/runtime.h>

static NSString *const kNTHandledKey = @"NetworkToolsHandled";

static NSInteger ntMaxBodyBytes(void) {
  return [NetworkToolsManager shared].maxBodyCaptureBytes;
}

// Original IMP saved during swizzle so we can call through to it.
static IMP gOriginalProtocolClassesIMP = nil;

// Replacement implementation for -[NSURLSessionConfiguration protocolClasses].
// Prepends NetworkToolsInterceptor to every session configuration, including
// React Native's internal sessions that are created before +activate is called.
static NSArray *nt_injectedProtocolClasses(NSURLSessionConfiguration *self, SEL _cmd) {
  NSArray *original = gOriginalProtocolClassesIMP
    ? ((NSArray *(*)(id, SEL))gOriginalProtocolClassesIMP)(self, _cmd)
    : @[];
  NSMutableArray *classes = original ? [original mutableCopy] : [NSMutableArray array];
  if (![classes containsObject:[NetworkToolsInterceptor class]]) {
    [classes insertObject:[NetworkToolsInterceptor class] atIndex:0];
  }
  return [classes copy];
}

@interface NetworkToolsInterceptor () <NSURLSessionDataDelegate>
@property (nonatomic, strong) NSURLSessionDataTask *dataTask;
// Strong reference to the forwarding session — without this the session is
// deallocated immediately, cancelling the data task before it can complete.
@property (nonatomic, strong) NSURLSession *forwardingSession;
@property (nonatomic, strong) NSMutableData *responseData;
@property (nonatomic, strong, nullable) NSHTTPURLResponse *httpResponse;
@property (nonatomic, assign) double requestStartTime;
@property (nonatomic, copy) NSString *requestId;
@property (nonatomic, strong, nullable) NSData *capturedRequestData;
@end

@implementation NetworkToolsInterceptor

#pragma mark - Swizzling

+ (void)swizzleSessionConfiguration {
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    Method m = class_getInstanceMethod(
      [NSURLSessionConfiguration class],
      @selector(protocolClasses)
    );
    gOriginalProtocolClassesIMP = method_setImplementation(m, (IMP)nt_injectedProtocolClasses);
  });
}

#pragma mark - NSURLProtocol registration

+ (BOOL)canInitWithRequest:(NSURLRequest *)request {
  if ([NSURLProtocol propertyForKey:kNTHandledKey inRequest:request]) {
    return NO;
  }
  NSString *scheme = request.URL.scheme.lowercaseString;
  return [scheme isEqualToString:@"http"] || [scheme isEqualToString:@"https"];
}

+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request {
  return request;
}

#pragma mark - Request lifecycle

- (void)startLoading {
  self.requestId = [[NSUUID UUID] UUIDString];
  self.requestStartTime = [NSDate date].timeIntervalSince1970 * 1000.0;
  self.responseData = [NSMutableData data];

  // Buffer the stream BEFORE mutableCopy — once the stream is read it cannot
  // be rewound, so copying the request after reading the stream produces a
  // forwarded request with an exhausted (empty) body.
  NSData *streamData = nil;
  if (self.request.HTTPBodyStream) {
    streamData = [self drainStream:self.request.HTTPBodyStream];
  }

  self.capturedRequestData = streamData.length > 0 ? streamData : self.request.HTTPBody;

  NSMutableURLRequest *forwarded = [self.request mutableCopy];

  // Replace the (now-exhausted) stream with the buffered NSData so the
  // forwarded request actually sends the correct body. Order matters:
  // HTTPBody and HTTPBodyStream are exclusive, so setting the stream (even
  // to nil) after the body would clear the body.
  if (streamData.length > 0) {
    forwarded.HTTPBodyStream = nil;
    forwarded.HTTPBody = streamData;
  }

  // Mark the forwarded request so canInitWithRequest: skips it.
  [NSURLProtocol setProperty:@YES forKey:kNTHandledKey inRequest:forwarded];

  // Use defaultSessionConfiguration so cookies and credentials are preserved.
  // Remove ourselves from its protocol list to prevent re-interception.
  NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
  NSMutableArray *protocols = config.protocolClasses
    ? [config.protocolClasses mutableCopy]
    : [NSMutableArray array];
  [protocols removeObject:[NetworkToolsInterceptor class]];
  config.protocolClasses = [protocols copy];

  self.forwardingSession = [NSURLSession sessionWithConfiguration:config
                                                         delegate:self
                                                    delegateQueue:nil];
  self.dataTask = [self.forwardingSession dataTaskWithRequest:forwarded];
  [self.dataTask resume];
}

- (void)stopLoading {
  [self.dataTask cancel];
  [self.forwardingSession invalidateAndCancel];
  self.dataTask = nil;
  self.forwardingSession = nil;
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler {
  self.httpResponse = [response isKindOfClass:[NSHTTPURLResponse class]]
    ? (NSHTTPURLResponse *)response : nil;
  [self.client URLProtocol:self
        didReceiveResponse:response
        cacheStoragePolicy:NSURLCacheStorageNotAllowed];
  completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data {
  [self.responseData appendData:data];
  [self.client URLProtocol:self didLoadData:data];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(nullable NSError *)error {
  if (error) {
    [self.client URLProtocol:self didFailWithError:error];
  } else {
    [self.client URLProtocolDidFinishLoading:self];
  }
  [self recordWithError:error];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
willPerformHTTPRedirection:(NSHTTPURLResponse *)response
        newRequest:(NSURLRequest *)newRequest
 completionHandler:(void (^)(NSURLRequest *_Nullable))completionHandler {
  [self.client URLProtocol:self wasRedirectedToRequest:newRequest redirectResponse:response];
  completionHandler(newRequest);
}

#pragma mark - Recording

- (void)recordWithError:(nullable NSError *)error {
  NSURLRequest *request = self.request;
  double responseTime = [NSDate date].timeIntervalSince1970 * 1000.0;
  double duration = responseTime - self.requestStartTime;

  NSSet<NSString *> *redactSet = [NetworkToolsManager shared].redactHeaderNames;
  NSHTTPURLResponse *response = self.httpResponse;

  NSMutableDictionary *entry = [NSMutableDictionary dictionary];
  entry[@"id"]             = self.requestId;
  entry[@"url"]            = request.URL.absoluteString ?: @"";
  entry[@"method"]         = request.HTTPMethod ?: @"GET";
  entry[@"requestTime"]    = @(self.requestStartTime);
  entry[@"responseTime"]   = @(responseTime);
  entry[@"duration"]       = @(duration);
  entry[@"responseCode"]   = response ? @(response.statusCode) : @0;
  entry[@"error"]          = error ? (error.localizedDescription ?: @"Unknown error") : @"";

  [self putHeaders:request.allHTTPHeaderFields ?: @{}
            prefix:@"request"
         redactSet:redactSet
              into:entry];
  [self putHeaders:(response ? response.allHeaderFields : @{})
            prefix:@"response"
         redactSet:redactSet
              into:entry];

  [self putBody:self.capturedRequestData
    contentType:[request valueForHTTPHeaderField:@"Content-Type"]
         prefix:@"request"
           into:entry];
  [self putBody:self.responseData
    contentType:[response valueForHTTPHeaderField:@"Content-Type"]
         prefix:@"response"
           into:entry];

  [[NetworkToolsStorage shared] addRequest:entry];
  [[NetworkToolsManager shared] emitRequest:entry];
}

#pragma mark - Helpers

// Writes <prefix>Headers and redacted<Prefix>Headers.
- (void)putHeaders:(NSDictionary *)headers
            prefix:(NSString *)prefix
         redactSet:(NSSet<NSString *> *)redactSet
              into:(NSMutableDictionary *)entry {
  NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:headers.count];
  NSMutableArray<NSString *> *redacted = [NSMutableArray array];
  [headers enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
    NSString *name = [key description];
    if ([redactSet containsObject:name.lowercaseString]) {
      result[name] = @"[redacted]";
      [redacted addObject:name];
    } else {
      result[name] = value;
    }
  }];
  entry[[prefix stringByAppendingString:@"Headers"]] = [result copy];
  NSString *capitalized = [[[prefix substringToIndex:1] uppercaseString]
                           stringByAppendingString:[prefix substringFromIndex:1]];
  entry[[NSString stringWithFormat:@"redacted%@Headers", capitalized]] = [redacted copy];
}

// Writes <prefix>Body, <prefix>BodyTruncated, <prefix>BodyEncoding and,
// when known, <prefix>ContentType.
- (void)putBody:(nullable NSData *)data
    contentType:(nullable NSString *)contentType
         prefix:(NSString *)prefix
           into:(NSMutableDictionary *)entry {
  NSUInteger limit = (NSUInteger)MAX(ntMaxBodyBytes(), 0);
  BOOL binary = [self isBinaryContentType:contentType];
  BOOL truncated = !binary && data.length > limit;
  NSString *body = @"";
  NSString *encoding = binary ? @"omitted" : @"utf8";

  if (!binary && data.length > 0) {
    NSData *capped = truncated ? [data subdataWithRange:NSMakeRange(0, limit)] : data;
    NSString *decoded = [self utf8StringFromData:capped allowTrailingTrim:truncated];
    if (decoded) {
      body = decoded;
    } else {
      encoding = @"omitted";
    }
  }

  entry[[prefix stringByAppendingString:@"Body"]] = body;
  entry[[prefix stringByAppendingString:@"BodyTruncated"]] = @(truncated);
  entry[[prefix stringByAppendingString:@"BodyEncoding"]] = encoding;
  if (contentType.length > 0) {
    entry[[prefix stringByAppendingString:@"ContentType"]] = contentType;
  }
}

// A cut at the capture limit can split a multi-byte character; drop up to 3
// trailing bytes so the rest still decodes.
- (nullable NSString *)utf8StringFromData:(NSData *)data allowTrailingTrim:(BOOL)allowTrim {
  NSUInteger maxTrim = allowTrim ? MIN((NSUInteger)3, data.length) : 0;
  for (NSUInteger trim = 0; trim <= maxTrim; trim++) {
    NSData *slice = trim == 0 ? data : [data subdataWithRange:NSMakeRange(0, data.length - trim)];
    NSString *decoded = [[NSString alloc] initWithData:slice encoding:NSUTF8StringEncoding];
    if (decoded) return decoded;
  }
  return nil;
}

- (BOOL)isBinaryContentType:(nullable NSString *)contentType {
  NSString *type = contentType.lowercaseString ?: @"";
  for (NSString *prefix in @[@"image/", @"video/", @"audio/", @"font/",
                             @"application/octet-stream", @"application/zip",
                             @"application/pdf", @"application/x-"]) {
    if ([type hasPrefix:prefix]) return YES;
  }
  return NO;
}

// Reads the whole stream: the buffered data is also what gets forwarded.
- (NSData *)drainStream:(NSInputStream *)stream {
  NSMutableData *buffer = [NSMutableData data];
  [stream open];
  uint8_t chunk[4096];
  NSInteger bytesRead;
  while ((bytesRead = [stream read:chunk maxLength:sizeof(chunk)]) > 0) {
    [buffer appendBytes:chunk length:(NSUInteger)bytesRead];
  }
  [stream close];
  return buffer;
}

@end
