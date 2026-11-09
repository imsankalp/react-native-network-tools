#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Maximum number of stored sessions; the oldest by start time are deleted first. */
FOUNDATION_EXPORT const NSInteger NTMaxStoredSessions;

typedef void (^NTSessionResultBlock)(id _Nullable result);

/**
 * Owns all writes to the sessions directory. Every operation runs on one
 * serial queue, and completions are called on that queue. Startup
 * housekeeping (schema check, orphan cleanup) runs before the first operation.
 */
@interface NetworkToolsSessionStore : NSObject

@property (class, nonatomic, readonly) NetworkToolsSessionStore *shared;

/**
 * Writes the session file, then adds `entry` (completed with sizeBytes and
 * schemaVersion) to the index and applies retention. Completes with the
 * stored index entry, or nil on failure.
 */
- (void)saveSessionEntry:(NSDictionary *)entry
                requests:(NSArray<NSDictionary *> *)requests
              completion:(NTSessionResultBlock)completion;

/** Completes with an array of index entries. */
- (void)listSessions:(NTSessionResultBlock)completion;

/** Completes with an array of request summaries, or nil if the session can't be read. */
- (void)summariesForSessionId:(NSString *)sessionId completion:(NTSessionResultBlock)completion;

/** Completes with the full request line, or nil. */
- (void)requestForSessionId:(NSString *)sessionId
                  requestId:(NSString *)requestId
                 completion:(NTSessionResultBlock)completion;

- (void)deleteSessionId:(NSString *)sessionId completion:(dispatch_block_t)completion;
- (void)clearSessions:(dispatch_block_t)completion;

@end

NS_ASSUME_NONNULL_END
