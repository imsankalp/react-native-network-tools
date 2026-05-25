#import "NetworkToolsInterceptor.h"
#import "NetworkToolsStorage.h"
#import "NetworkToolsManager.h"

// Property key used to mark requests this interceptor is already handling,
// preventing infinite recursion when the forwarding URLSession is created.
static NSString *const kNTHandledKey = @"NetworkToolsHandled";

// Cap body capture at 256 KB to avoid buffering large binary payloads in RAM.
static const NSInteger kNTMaxBodyBytes = 256 * 1024;

@interface NetworkToolsInterceptor () <NSURLSessionDataDelegate>
@property (nonatomic, strong) NSURLSessionDataTask *dataTask;
@property (nonatomic, strong) NSMutableData *responseData;
@property (nonatomic, strong, nullable) NSHTTPURLResponse *httpResponse;
@property (nonatomic, assign) double requestStartTime;
@property (nonatomic, copy) NSString *requestId;
@property (nonatomic, copy, nullable) NSString *capturedRequestBody;
@end

@implementation NetworkToolsInterceptor

#pragma mark - NSURLProtocol registration

+ (BOOL)canInitWithRequest:(NSURLRequest *)request {
  // Skip requests already being handled by us (prevents infinite loop).
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
  self.capturedRequestBody = [self readBodyFromRequest:self.request];

  // Tag the forwarded request so we don't intercept it again.
  NSMutableURLRequest *forwarded = [self.request mutableCopy];
  [NSURLProtocol setProperty:@YES forKey:kNTHandledKey inRequest:forwarded];

  // Use an ephemeral session so cookies / cache don't bleed between the
  // interceptor's internal session and the app's session.
  NSURLSessionConfiguration *config = [NSURLSessionConfiguration ephemeralSessionConfiguration];
  NSURLSession *session = [NSURLSession sessionWithConfiguration:config
                                                        delegate:self
                                                   delegateQueue:nil];
  self.dataTask = [session dataTaskWithRequest:forwarded];
  [self.dataTask resume];
}

- (void)stopLoading {
  [self.dataTask cancel];
  self.dataTask = nil;
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
  // Pass redirects through transparently; the final response is what gets recorded.
  [self.client URLProtocol:self wasRedirectedToRequest:newRequest redirectResponse:response];
  completionHandler(newRequest);
}

#pragma mark - Recording

- (void)recordWithError:(nullable NSError *)error {
  NSURLRequest *request = self.request;
  double responseTime = [NSDate date].timeIntervalSince1970 * 1000.0;
  double duration = responseTime - self.requestStartTime;

  NSMutableDictionary *entry = [NSMutableDictionary dictionary];
  entry[@"id"]          = self.requestId;
  entry[@"url"]         = request.URL.absoluteString ?: @"";
  entry[@"method"]      = request.HTTPMethod ?: @"GET";
  entry[@"requestTime"] = @(self.requestStartTime);
  entry[@"responseTime"] = @(responseTime);
  entry[@"duration"]    = @(duration);

  // Request headers
  entry[@"requestHeaders"] = request.allHTTPHeaderFields ?: @{};

  // Request body (already captured in startLoading before the request was sent)
  entry[@"requestBody"] = self.capturedRequestBody ?: @"";

  // Response
  NSHTTPURLResponse *response = self.httpResponse;
  entry[@"responseCode"]    = response ? @(response.statusCode) : @0;
  entry[@"responseHeaders"] = response ? response.allHeaderFields : @{};

  // Response body — skip binary content types, cap text bodies
  entry[@"responseBody"] = [self responseBodyStringForResponse:response];

  // Error
  entry[@"error"] = error ? (error.localizedDescription ?: @"Unknown error") : @"";

  [[NetworkToolsStorage shared] addRequest:entry];
  [[NetworkToolsManager shared] emitRequest:entry];
}

#pragma mark - Helpers

- (nullable NSString *)readBodyFromRequest:(NSURLRequest *)request {
  NSData *bodyData = nil;

  if (request.HTTPBody.length > 0) {
    bodyData = request.HTTPBody;
  } else if (request.HTTPBodyStream) {
    NSInputStream *stream = request.HTTPBodyStream;
    [stream open];
    NSMutableData *buffer = [NSMutableData data];
    uint8_t chunk[4096];
    NSInteger bytesRead;
    NSInteger totalRead = 0;
    while (totalRead < kNTMaxBodyBytes &&
           (bytesRead = [stream read:chunk maxLength:sizeof(chunk)]) > 0) {
      [buffer appendBytes:chunk length:(NSUInteger)bytesRead];
      totalRead += bytesRead;
    }
    [stream close];
    bodyData = buffer.length > 0 ? buffer : nil;
  }

  if (!bodyData) return nil;

  NSData *capped = bodyData.length <= (NSUInteger)kNTMaxBodyBytes
    ? bodyData
    : [bodyData subdataWithRange:NSMakeRange(0, (NSUInteger)kNTMaxBodyBytes)];
  return [[NSString alloc] initWithData:capped encoding:NSUTF8StringEncoding];
}

- (NSString *)responseBodyStringForResponse:(nullable NSHTTPURLResponse *)response {
  // Skip binary MIME types entirely.
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
