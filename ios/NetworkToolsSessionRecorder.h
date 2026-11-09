#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Holds the one active recording session in native memory, so it survives
 * JS reloads. Fed by the interceptor with every completed request.
 */
@interface NetworkToolsSessionRecorder : NSObject

@property (class, nonatomic, readonly) NetworkToolsSessionRecorder *shared;

/** Starts a recording. Nil if one is already active or capture isn't active. */
- (nullable NSDictionary *)start;

/** Stops and saves the recording. Completes with the stored index entry, or nil if nothing was recording. */
- (void)stopWithCompletion:(void (^)(NSDictionary *_Nullable entry))completion;

/** Adds the request to the active session if it started after recording began. */
- (void)recordRequest:(NSDictionary *)request;

/** Active session JSON object, or nil. */
- (nullable NSDictionary *)activeSession;

/** Summaries of the active session's requests in capture order. */
- (NSArray<NSDictionary *> *)activeSummaries;

@end

NS_ASSUME_NONNULL_END
