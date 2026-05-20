# Development Checklist

This checklist will help you complete the development and testing of react-native-network-tools.

## ✅ Completed

- [x] OkHttp interceptor implementation
- [x] Network request data model
- [x] In-memory storage system
- [x] NetworkToolsManager singleton
- [x] React Native TurboModule bridge
- [x] TypeScript API and types
- [x] Build type configuration (debug/release)
- [x] Comprehensive documentation
- [x] Integration examples
- [x] Architecture documentation
- [ ] - Zod custom error creation and handling in UI

## 📋 Next Steps

### 1. Build and Test

- [ ] Build the library
  ```bash
  yarn prepare
  ```

- [ ] Build the example app
  ```bash
  cd example
  yarn install
  cd android && ./gradlew clean
  cd ..
  yarn android
  ```

- [ ] Test basic functionality
  - [ ] Enable network tracking
  - [ ] Make some HTTP requests
  - [ ] Verify requests are captured
  - [ ] Test getAllRequests()
  - [ ] Test clearAllRequests()
  - [ ] Test getRequestCount()

### 2. Test Build Types

- [ ] Test debug build
  - [ ] Verify tracking is enabled
  - [ ] Check BuildConfig.NETWORK_TOOLS_ENABLED is true
  - [ ] Confirm requests are captured

- [ ] Test release build
  ```bash
  cd example/android
  ./gradlew assembleRelease
  ```
  - [ ] Verify tracking is disabled
  - [ ] Check BuildConfig.NETWORK_TOOLS_ENABLED is false
  - [ ] Confirm no overhead

### 3. Update Example App

- [ ] Update example app to demonstrate the library
  - [ ] Add network request examples
  - [ ] Create a debug screen to view requests
  - [ ] Add buttons to test all API methods
  - [ ] Show request details in UI

- [ ] Example code to add:
  ```typescript
  // In example/src/App.tsx
  import * as NetworkTools from 'react-native-network-tools';

  useEffect(() => {
    NetworkTools.enable();

    // Make some test requests
    fetch('https://jsonplaceholder.typicode.com/posts/1');
    fetch('https://jsonplaceholder.typicode.com/users/1');
  }, []);

  const showRequests = () => {
    const requests = NetworkTools.getAllRequests();
    console.log('Captured requests:', requests);
  };
  ```

### 4. Add Tests

- [ ] Unit tests for storage
  ```kotlin
  // Test NetworkRequestStorage
  - addRequest()
  - getAllRequests()
  - getRequestById()
  - clearAll()
  - getCount()
  - max limit enforcement
  ```

- [ ] Unit tests for data model
  ```kotlin
  // Test NetworkRequest
  - toJson()
  - fromJson()
  - data integrity
  ```

- [ ] Integration tests
  ```kotlin
  // Test interceptor with real OkHttp
  - successful request capture
  - error handling
  - concurrent requests
  ```

- [ ] JavaScript tests
  ```typescript
  // Test TypeScript API
  - enable/disable
  - getAllRequests parsing
  - error handling
  ```

### 5. Documentation Updates

- [ ] Add screenshots to README
- [ ] Create demo GIF/video
- [ ] Add more code examples
- [ ] Update CONTRIBUTING.md with development setup
- [ ] Add CHANGELOG.md

### 6. iOS Support (Future)

- [ ] Create URLSession interceptor
- [ ] Mirror Android architecture
- [ ] Update TypeScript bridge
- [ ] Test on iOS
- [ ] Update documentation

### 7. Advanced Features

#### Tier 1 — Core Inspector Completeness

- [ ] Session summary dashboard
  - [ ] Total requests, success/fail counts, total data transferred
  - [ ] Average and peak latency at a glance
  - [ ] Shown as a stats panel above the request list

- [ ] Export to CSV / JSON
  - [ ] Serialize all captured requests to CSV rows
  - [ ] Full JSON dump of session
  - [ ] Write to device file system, then trigger share sheet

- [ ] Share individual request
  - [ ] Long-press a request to open share options
  - [ ] Format choices: plain text summary, JSON, cURL command
  - [ ] Use RN `Share` API / `expo-sharing`

- [ ] HAR (HTTP Archive) export
  - [ ] Full HAR 1.2 format — importable into Postman, Charles, Proxyman, browser DevTools
  - [ ] Include timings, headers, bodies, cookies

- [ ] cURL copy
  - [ ] One-tap copy of a request as a ready-to-run `curl` command
  - [ ] Include headers, method, body, and URL

#### Tier 2 — Analytics & Statistics

- [ ] Data usage breakdown
  - [ ] Bytes sent and received per domain
  - [ ] Bytes per endpoint
  - [ ] Running total for the session

- [ ] Response time distribution
  - [ ] P50 / P95 / P99 latency per domain
  - [ ] Simple histogram or spark-line view
  - [ ] Time-to-first-byte (TTFB) separate from total duration

- [ ] Per-domain leaderboard
  - [ ] Sorted by: slowest average, most calls, most errors
  - [ ] Drillable — tap domain to see its requests

- [ ] Slow request alerts
  - [ ] Configurable threshold (e.g. > 2 s) via `NetworkMonitorProvider` prop
  - [ ] Visual badge / highlight on slow requests in the list

- [ ] Error rate tracking
  - [ ] 4xx / 5xx frequency over time within a session
  - [ ] Separate counters for client errors vs server errors

#### Tier 3 — Developer Productivity

- [ ] Persistent storage (opt-in)
  - [ ] Save requests across restarts to AsyncStorage or MMKV
  - [ ] Configurable via `persistRequests` prop on `NetworkMonitorProvider`
  - [ ] Clear-on-launch option

- [ ] Pinned / bookmarked requests
  - [ ] Mark specific requests to prevent FIFO eviction
  - [ ] Separate "Pinned" tab in the monitor UI

- [ ] Regex search and filter
  - [ ] Toggle between plain-text and regex mode in the search bar
  - [ ] Filter across URL, headers, and body simultaneously
  - [ ] Filter by URL pattern, method, status code, time range (migrated from old list)

- [ ] Request diff
  - [ ] Select two requests to the same endpoint and compare side-by-side
  - [ ] Highlight header / body changes between calls (useful for pagination, mutations)

- [ ] GraphQL-aware display
  - [ ] Parse `operationName`, `variables`, and `data` from GraphQL POST bodies
  - [ ] Show operation name as the display title instead of the raw URL

- [ ] WebSocket monitoring
  - [ ] Capture WebSocket frames via a custom OkHttp `WebSocketListener` wrapper
  - [ ] Show open/close events and individual frames in a dedicated tab

#### Tier 4 — Power Features

- [ ] Mock / intercept responses
  - [ ] Match requests by URL pattern and return a configured mock response
  - [ ] No-server testing directly from the in-app tool
  - [ ] Mock editor UI — status code, headers, body
  - [ ] Conditional mocking (e.g. only on N-th call)

- [ ] Replay requests
  - [ ] Re-fire a captured request with one tap
  - [ ] Editable replay — modify headers / body before sending
  - [ ] Batch replay of a selected set of requests

- [ ] Network condition simulation
  - [ ] Artificial latency injection (configurable ms)
  - [ ] Bandwidth throttling (configurable KB/s)
  - [ ] Simulate offline / flaky connection

- [ ] Sensitive header redaction
  - [ ] Auto-mask `Authorization`, `Cookie`, `X-Api-Key` by default
  - [ ] Configurable allowlist / blocklist via `NetworkMonitorProvider` prop
  - [ ] Toggle reveal on tap in the detail view

- [ ] Shake-to-open
  - [ ] Open the network monitor on device shake — no floating button required
  - [ ] Opt-in via `openOnShake` prop

- [ ] Desktop companion / Metro plugin
  - [ ] Stream captured requests to a browser panel alongside the Metro bundler
  - [ ] WebSocket bridge from the app to a local dev-server listener

### 8. Pre-Release Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Example app working
- [ ] README has clear instructions
- [ ] License file present
- [ ] CHANGELOG.md created
- [ ] Version number set (0.1.0)
- [ ] Package.json metadata complete

### 9. Publishing

- [ ] Test package build
  ```bash
  npm pack
  ```

- [ ] Test installation from tarball
  ```bash
  npm install react-native-network-tools-0.1.0.tgz
  ```

- [ ] Publish to npm
  ```bash
  npm publish
  ```

- [ ] Create GitHub release
  - [ ] Tag version
  - [ ] Release notes
  - [ ] Attach artifacts

- [ ] Announce
  - [ ] Twitter/X
  - [ ] Reddit (r/reactnative)
  - [ ] Dev.to article
  - [ ] React Native newsletter

### 10. Post-Release

- [ ] Monitor issues
- [ ] Respond to questions
- [ ] Fix bugs
- [ ] Plan next version
- [ ] Gather feedback

## 🐛 Known Issues to Address

- [ ] TypeScript lint error for react-native import (expected, will resolve when installed)
- [ ] Need to test with various OkHttp versions
- [ ] Need to test with different React Native versions
- [ ] Consider adding ProGuard rules for release builds

## 💡 Ideas for Future Versions

- WebSocket support
- GraphQL query tracking
- Performance metrics (time to first byte, etc.)
- Network error analytics
- Automatic issue detection (slow requests, failures)
- Integration with crash reporting tools
- Desktop viewer app
- Request diff/comparison
- Network timeline visualization
- Bandwidth usage tracking

## 📝 Notes

- The library is currently Android-only
- Requires React Native 0.68+
- Requires OkHttp 4.x
- Only works in debug builds by default
- Maximum 100 requests stored in memory

## 🤔 Questions to Consider

1. Should we add persistent storage option?
2. Should we add request size limits?
3. Should we filter out certain headers by default (e.g., Authorization)?
4. Should we add a UI component package separately?
5. Should we support custom storage backends?

## 📚 Resources

- [OkHttp Documentation](https://square.github.io/okhttp/)
- [React Native TurboModules](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [Android Build Types](https://developer.android.com/studio/build/build-variants)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

---

**Last Updated**: Initial implementation complete
**Status**: Ready for testing
**Next Milestone**: v0.1.0 release
