#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Thread-safe in-memory store for captured network requests.
 * Mirrors Android's NetworkRequestStorage.kt.
 */
@interface NetworkToolsStorage : NSObject

@property (class, nonatomic, readonly) NetworkToolsStorage *shared;

- (void)addRequest:(NSDictionary *)request;
- (NSArray<NSDictionary *> *)allRequests;
- (nullable NSDictionary *)requestById:(NSString *)requestId;
- (void)clearAll;
- (NSInteger)count;

@end

NS_ASSUME_NONNULL_END
