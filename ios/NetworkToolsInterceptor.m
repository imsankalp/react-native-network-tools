#import "NetworkToolsInterceptor.h"
#import "NetworkToolsStorage.h"
#import "NetworkToolsManager.h"
#import <objc/runtime.h>

static NSString *const kNTHandledKey = @"NetworkToolsHandled";
static const NSInteger kNTMaxBodyBytes = 256 * 1024;

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
@property (nonatomic, copy, nullable) NSString *capturedRequestBody;
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

  // Capture body string for recording.
  if (streamData.length > 0) {
    self.capturedRequestBody = [self bodyStringFromData:streamData];
  } else if (self.request.HTTPBody.length > 0) {
    self.capturedRequestBody = [self bodyStringFromData:self.request.HTTPBody];
  }

  NSMutableURLRequest *forwarded = [self.request mutableCopy];

  // Replace the (now-exhausted) stream with the buffered NSData so the
  // forwarded request actually sends the correct body.
  if (streamData.length > 0) {
    forwarded.HTTPBody = streamData;
    forwarded.HTTPBodyStream = nil;
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

  NSMutableDictionary *entry = [NSMutableDictionary dictionary];
  entry[@"id"]             = self.requestId;
  entry[@"url"]            = request.URL.absoluteString ?: @"";
  entry[@"method"]         = request.HTTPMethod ?: @"GET";
  entry[@"requestTime"]    = @(self.requestStartTime);
  entry[@"responseTime"]   = @(responseTime);
  entry[@"duration"]       = @(duration);
  entry[@"requestHeaders"] = request.allHTTPHeaderFields ?: @{};
  entry[@"requestBody"]    = self.capturedRequestBody ?: @"";

  NSHTTPURLResponse *response = self.httpResponse;
  entry[@"responseCode"]    = response ? @(response.statusCode) : @0;
  entry[@"responseHeaders"] = response ? response.allHeaderFields : @{};
  entry[@"responseBody"]    = [self responseBodyStringForResponse:response];
  entry[@"error"]           = error ? (error.localizedDescription ?: @"Unknown error") : @"";

  [[NetworkToolsStorage shared] addRequest:entry];
  [[NetworkToolsManager shared] emitRequest:entry];
}

#pragma mark - Helpers

- (NSData *)drainStream:(NSInputStream *)stream {
  NSMutableData *buffer = [NSMutableData data];
  [stream open];
  uint8_t chunk[4096];
  NSInteger bytesRead;
  NSInteger totalRead = 0;
  while (totalRead < kNTMaxBodyBytes &&
         (bytesRead = [stream read:chunk maxLength:sizeof(chunk)]) > 0) {
    [buffer appendBytes:chunk length:(NSUInteger)bytesRead];
    totalRead += bytesRead;
  }
  [stream close];
  return buffer;
}

- (nullable NSString *)bodyStringFromData:(NSData *)data {
  if (data.length == 0) return nil;
  NSData *capped = data.length <= (NSUInteger)kNTMaxBodyBytes
    ? data
    : [data subdataWithRange:NSMakeRange(0, (NSUInteger)kNTMaxBodyBytes)];
  return [[NSString alloc] initWithData:capped encoding:NSUTF8StringEncoding];
}

- (NSString *)responseBodyStringForResponse:(nullable NSHTTPURLResponse *)response {
  NSString *mimeType = response.MIMEType.lowercaseString ?: @"";
  if ([mimeType hasPrefix:@"image/"] ||
      [mimeType hasPrefix:@"video/"] ||
      [mimeType hasPrefix:@"audio/"] ||
      [mimeType isEqualToString:@"application/octet-stream"] ||
      [mimeType isEqualToString:@"application/zip"]) {
    return @"[binary content — not captured]";
  }

  if (self.responseData.length == 0) return @"";

  NSData *capped = self.responseData.length <= (NSUInteger)kNTMaxBodyBytes
    ? self.responseData
    : [self.responseData subdataWithRange:NSMakeRange(0, (NSUInteger)kNTMaxBodyBytes)];

  NSString *body = [[NSString alloc] initWithData:capped encoding:NSUTF8StringEncoding] ?: @"";

  if (self.responseData.length > (NSUInteger)kNTMaxBodyBytes) {
    body = [body stringByAppendingFormat:@"\n[... truncated — %lu bytes total]",
            (unsigned long)self.responseData.length];
  }
  return body;
}

@end
