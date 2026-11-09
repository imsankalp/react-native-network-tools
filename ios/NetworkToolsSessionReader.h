#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Schema version of the session files this library reads and writes. */
FOUNDATION_EXPORT const NSInteger NTSessionSchemaVersion;

/**
 * Stateless reader for the on-disk session format (docs/SESSION_FILE_FORMAT.md).
 * Depends only on the format, so code other than the recorder can use it.
 */
@interface NetworkToolsSessionReader : NSObject

/** `<Application Support>/network-tools/sessions/` */
+ (NSURL *)sessionsDirectory;
+ (NSURL *)indexURL;
+ (NSURL *)fileURLForSessionId:(NSString *)sessionId;

/** Parsed index.json, or nil if it is missing or not valid JSON. */
+ (nullable NSDictionary *)readIndex;

/** Request lines of a session in file order. Malformed lines are skipped. Nil if the file can't be read. */
+ (nullable NSArray<NSDictionary *> *)readRequestsForSessionId:(NSString *)sessionId;

/** The list-screen fields of a stored request line. */
+ (NSDictionary *)summaryForRequest:(NSDictionary *)request;

@end

NS_ASSUME_NONNULL_END
