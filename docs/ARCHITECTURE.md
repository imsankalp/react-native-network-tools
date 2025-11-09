# Architecture Overview

This document explains the architecture and design decisions of the react-native-network-tools library.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TypeScript API (src/index.tsx)                      │  │
│  │  - enable(), disable(), isEnabled()                  │  │
│  │  - getAllRequests(), getRequestById()                │  │
│  │  - clearAllRequests(), getRequestCount()             │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TurboModule Bridge (NativeNetworkTools.ts)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Native Layer (Android)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NetworkToolsModule.kt                               │  │
│  │  - Implements TurboModule interface                  │  │
│  │  - Bridges JS calls to native code                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NetworkToolsManager.kt                              │  │
│  │  - Singleton manager for interceptor                 │  │
│  │  - Controls enable/disable state                     │  │
│  │  - Provides interceptor to OkHttpClient              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NetworkToolsInterceptor.kt                          │  │
│  │  - OkHttp Interceptor implementation                 │  │
│  │  - Captures request/response data                    │  │
│  │  - Handles errors gracefully                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NetworkRequestStorage.kt                            │  │
│  │  - In-memory storage (ConcurrentLinkedQueue)         │  │
│  │  - Thread-safe operations                            │  │
│  │  - Auto-cleanup (max 100 requests)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NetworkRequest.kt (Data Model)                      │  │
│  │  - Request/response data structure                   │  │
│  │  - JSON serialization                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. TypeScript API Layer

**File**: `src/index.tsx`

The public API that developers interact with. Provides a clean, typed interface for:
- Enabling/disabling network tracking
- Retrieving captured requests
- Managing stored data

**Design Decision**: Simple functional API rather than class-based for ease of use.

### 2. TurboModule Bridge

**File**: `src/NativeNetworkTools.ts`

Defines the interface between JavaScript and native code using React Native's TurboModule system.

**Why TurboModule?**
- Better performance than legacy bridge
- Type-safe interface
- Synchronous method calls where needed

### 3. Native Module

**File**: `android/src/main/java/com/networktools/NetworkToolsModule.kt`

Implements the TurboModule interface and bridges calls to the native implementation.

**Responsibilities**:
- Expose native functionality to JavaScript
- Convert between native and JavaScript data types
- Handle JSON serialization

### 4. Network Tools Manager

**File**: `android/src/main/java/com/networktools/NetworkToolsManager.kt`

Singleton manager that controls the interceptor lifecycle.

**Key Features**:
- Build-type aware (only works in debug builds)
- Provides easy integration with OkHttpClient
- Centralized enable/disable control

**Design Decision**: Singleton pattern ensures consistent state across the app.

### 5. OkHttp Interceptor

**File**: `android/src/main/java/com/networktools/interceptor/NetworkToolsInterceptor.kt`

The core component that captures network traffic.

**How it works**:
1. Intercepts outgoing requests
2. Captures request details (headers, body, timing)
3. Proceeds with the request
4. Captures response details (status, headers, body, timing)
5. Stores the complete request/response pair
6. Handles errors and exceptions

**Design Decisions**:
- Non-intrusive: Doesn't modify requests/responses
- Error-safe: Catches exceptions to prevent app crashes
- Efficient: Minimal overhead, only active when enabled

### 6. Storage Layer

**File**: `android/src/main/java/com/networktools/storage/NetworkRequestStorage.kt`

In-memory storage for captured requests.

**Implementation**:
- `ConcurrentLinkedQueue` for thread-safety
- FIFO with automatic cleanup (max 100 requests)
- Simple CRUD operations

**Why in-memory?**
- Fast access
- No disk I/O overhead
- Automatic cleanup on app restart
- No privacy concerns with persistent storage

### 7. Data Model

**File**: `android/src/main/java/com/networktools/models/NetworkRequest.kt`

Data class representing a captured network request.

**Fields**:
- Request data: URL, method, headers, body, timestamp
- Response data: status code, headers, body, timestamp
- Metadata: duration, error information
- Unique ID for tracking

## Build Configuration Strategy

### Build Types

The library uses Android build types to control when network tracking is active:

```gradle
buildTypes {
  debug {
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "true"
  }
  release {
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "false"
  }
}
```

**Benefits**:
1. **Zero overhead in production**: Interceptor is not added in release builds
2. **Automatic**: No manual configuration needed
3. **Safe**: Impossible to accidentally enable in production
4. **Flexible**: Can be customized for staging/QA builds

### Alternative Strategies Considered

1. **Product Flavors**: More complex, but allows per-flavor control
2. **Runtime Configuration**: More flexible but requires manual management
3. **Gradle Properties**: External configuration but less type-safe

**Why Build Types?**
- Simplest implementation
- Aligns with standard debug/release workflow
- Compile-time safety
- No runtime overhead when disabled

## Data Flow

### Capturing a Request

```
1. App makes HTTP request
   ↓
2. OkHttpClient processes request
   ↓
3. NetworkToolsInterceptor.intercept() called
   ↓
4. Capture request details (headers, body, time)
   ↓
5. Proceed with actual network call
   ↓
6. Capture response details (status, headers, body, time)
   ↓
7. Store NetworkRequest in NetworkRequestStorage
   ↓
8. Return response to app (unchanged)
```

### Retrieving Requests

```
1. JS calls NetworkTools.getAllRequests()
   ↓
2. TurboModule bridge to NetworkToolsModule.getAllRequests()
   ↓
3. NetworkRequestStorage.getAllRequests()
   ↓
4. Convert List<NetworkRequest> to JSON string
   ↓
5. Return to JS layer
   ↓
6. Parse JSON to NetworkRequest[]
   ↓
7. Return to application code
```

## Thread Safety

### Concurrent Access

The library handles concurrent access at multiple levels:

1. **Storage**: `ConcurrentLinkedQueue` allows safe concurrent reads/writes
2. **Interceptor**: Each request runs in its own thread (OkHttp behavior)
3. **Manager**: Singleton with thread-safe operations

### No Locks Needed

By using concurrent data structures, we avoid explicit locking, which:
- Improves performance
- Reduces complexity
- Prevents deadlocks

## Performance Considerations

### Memory Usage

- **Storage limit**: 100 requests maximum
- **Automatic cleanup**: FIFO eviction
- **Typical memory**: ~50-100KB for 100 requests (depends on payload size)

### CPU Overhead

- **Request capture**: ~1-2ms per request
- **JSON serialization**: Only when data is retrieved
- **Zero overhead**: When disabled or in release builds

### Network Impact

- **None**: Interceptor doesn't modify or delay requests
- **Response buffering**: Minimal, only for capturing body

## Security Considerations

### Sensitive Data

**Risks**:
- Request/response bodies may contain sensitive data
- Headers may contain auth tokens
- URLs may contain API keys

**Mitigations**:
1. Debug-only by default
2. In-memory storage (cleared on app restart)
3. No persistent storage
4. No network transmission of captured data

**Recommendations**:
- Don't use in production
- Clear data regularly
- Be cautious with shared devices
- Consider filtering sensitive headers

## Extensibility

### Future Enhancements

The architecture supports easy addition of:

1. **Filtering**: Filter requests by URL, method, status
2. **Search**: Search through request/response bodies
3. **Export**: Export requests to file or share
4. **Persistence**: Optional disk storage
5. **UI Components**: Pre-built inspector screens
6. **iOS Support**: Similar architecture for URLSession
7. **Request Replay**: Replay captured requests
8. **Mock Responses**: Return mock data for testing

### Plugin Architecture

The manager pattern allows for:
- Custom interceptors
- Multiple storage backends
- Custom serialization formats
- Analytics integration

## Testing Strategy

### Unit Tests

- Storage operations
- Data model serialization
- Manager state management

### Integration Tests

- Interceptor with real OkHttp
- End-to-end request capture
- TurboModule bridge

### Manual Testing

- Example app with various network scenarios
- Performance testing with many requests
- Memory leak detection

## Comparison with Alternatives

### vs. Flipper

**Advantages**:
- No external dependencies
- Simpler setup
- Lightweight
- Works offline

**Disadvantages**:
- Less features
- No desktop UI (yet)
- Android-only (currently)

### vs. Reactotron

**Advantages**:
- Native implementation (better performance)
- Build-type aware
- No separate app needed

**Disadvantages**:
- Fewer debugging features
- No state inspection
- No timeline view

## Conclusion

The architecture prioritizes:
1. **Simplicity**: Easy to integrate and use
2. **Performance**: Minimal overhead, debug-only
3. **Safety**: Thread-safe, error-handling
4. **Extensibility**: Easy to add features

The build-type strategy ensures zero impact on production while providing powerful debugging capabilities in development.
