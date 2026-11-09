# react-native-network-tools

Inspect all network requests in your React Native app via a floating overlay. Zero overhead in production — tracking only runs in debug mode.

![](Screen_recording_20260204_002905.mp4)

## Platform Support

| Platform                                | Status                  |
| --------------------------------------- | ----------------------- |
| React Native Android (New Architecture) | ✅                      |
| React Native Android (Old Architecture) | ✅                      |
| React Native iOS (New Architecture)     | ✅                      |
| React Native iOS (Old Architecture)     | ✅                      |
| Expo Development Build                  | ✅                      |
| Expo Go                                 | ❌ Requires a dev build |

---

## Installation

```sh
npm install react-native-network-tools
# or
yarn add react-native-network-tools
```

No additional peer dependencies required — the library is built entirely on React Native built-ins.

---

## Setup

### Android — hook the interceptor

#### 1. Register the no-op artifact (recommended)

The library ships an `android-no-op` variant that replaces every implementation class with empty stubs in release builds, so **no interceptor, storage, or event-emitter code is compiled into your production APK**.

In `android/settings.gradle`, include the no-op module alongside your app:

```gradle
include ':react-native-network-tools-no-op'
project(':react-native-network-tools-no-op').projectDir =
    new File(rootProject.projectDir, '../node_modules/react-native-network-tools/android-no-op')
```

In `android/app/build.gradle`, swap the autolinked debug implementation for the no-op in release:

```gradle
dependencies {
    // debugImplementation is handled automatically by autolink
    releaseImplementation project(':react-native-network-tools-no-op')
}
```

#### 2. Hook the interceptor in `MainApplication.kt`

With the no-op artifact in place you no longer need the `if (BuildConfig.DEBUG)` guard — `NetworkToolsManager.addInterceptor` is a no-op in release builds automatically:

```kotlin
import com.facebook.react.modules.network.NetworkingModule
import com.networktools.NetworkToolsManager
import okhttp3.OkHttpClient

class MainApplication : Application(), ReactApplication {

  override fun onCreate() {
    super.onCreate()

    NetworkingModule.setCustomClientBuilder(
      object : NetworkingModule.CustomClientBuilder {
        override fun apply(builder: OkHttpClient.Builder) {
          NetworkToolsManager.addInterceptor(builder)
        }
      }
    )

    // rest of your setup
  }
}
```

You can verify the production APK contains no library classes with:

```bash
apkanalyzer dex packages --defined-only app-release.apk | grep networktools
# should produce no output
```

### iOS — activate the URLProtocol interceptor

In `AppDelegate.swift`:

```swift
import NetworkTools

func application(
  _ application: UIApplication,
  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
) -> Bool {
  #if DEBUG
  NetworkToolsManager.activate()
  #endif

  return true
}
```

For Objective-C `AppDelegate.mm`:

```objc
#import <NetworkTools/NetworkToolsManager.h>

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#if DEBUG
  [NetworkToolsManager activate];
#endif
  return YES;
}
```

### Expo — use the config plugin

Add the plugin to `app.json` and run `expo prebuild`. The plugin patches both `MainApplication` and `AppDelegate` automatically.

```json
{
  "expo": {
    "plugins": ["react-native-network-tools"]
  }
}
```

---

## Usage

### 1. Wrap your app

Wrap your root component with `NetworkMonitorProvider`. No wrapper components from other libraries are needed.

```tsx
import { NetworkMonitorProvider } from 'react-native-network-tools';

export default function App() {
  return <NetworkMonitorProvider>{/* your app */}</NetworkMonitorProvider>;
}
```

`NetworkMonitorProvider` props:

| Prop                      | Type                                 | Default  | Description                                     |
| ------------------------- | ------------------------------------ | -------- | ----------------------------------------------- |
| `maxRequests`             | `number`                             | `1000`   | Max requests kept in memory (FIFO eviction)     |
| `showFloatingMonitor`     | `boolean`                            | `true`   | Whether to render the draggable floating button |
| `triggerMode`             | `'dev-menu' \| 'floating' \| 'both'` | `'both'` | How the inspector is opened (see below)         |
| `redactHeaders`           | `string[]`                           | —        | Replace the default redact list entirely        |
| `additionalRedactHeaders` | `string[]`                           | —        | Append to the default redact list               |
| `revealRedactedHeaders`   | `boolean`                            | `true`   | Show `[redacted]` values in the UI              |

**`triggerMode` options:**

| Value                | Dev builds                         | Production builds       |
| -------------------- | ---------------------------------- | ----------------------- |
| `"dev-menu"`         | Dev menu item only (shake / Cmd+D) | Panel cannot be opened  |
| `"floating"`         | Floating button only               | Floating button visible |
| `"both"` _(default)_ | Dev menu + floating button         | Floating button only    |

> In production, `DevSettings` is stripped by React Native at the native level. Use `showFloatingMonitor={__DEV__}` to hide the button in release builds.

### 2. Access requests in code (optional)

```tsx
import { useNetworkMonitor } from 'react-native-network-tools';

function DebugScreen() {
  const { requests, clearRequests } = useNetworkMonitor();

  return (
    <View>
      <Text>{requests.length} requests captured</Text>
      <Button title="Clear" onPress={clearRequests} />
    </View>
  );
}
```

`useNetworkMonitor` must be called inside `NetworkMonitorProvider`.

### 3. Annotate errors (optional)

Attach a custom error to any captured request for richer debugging:

```ts
import { annotateNetworkRequestError } from 'react-native-network-tools';

annotateNetworkRequestError({
  url: 'https://api.example.com/login',
  method: 'POST',
  message: 'Validation failed: email is required',
  type: 'validation', // 'http' | 'validation' | 'custom'
  code: 'EMAIL_REQUIRED',
});
```

### 4. Record sessions (debug builds)

The **Sessions** tab records the requests of one flow, such as a login, so you can review them later without the rest of the app's traffic.

1. Open the monitor, go to **Sessions** and tap **Start recording**.
2. Use your app. You can close the monitor; a red dot on the floating button shows that a recording is running.
3. Reopen the monitor and tap **Stop**. The saved session opens, listing its requests in order; tap one for full details.

How it behaves:

- One recording at a time. A request belongs to the session if it **started and finished** while recording; requests still in flight when you tap Stop are not included.
- A recording survives closing the monitor and JS reloads. It is lost if the app process is killed before you stop it.
- Each session holds at most `maxRequests` requests. At the limit, capture stops and the session is marked "limit reached".
- Sessions are named `api-recording-YYYY-MM-DDTHH-mm-ss` (local start time). The 20 most recent are kept.
- `clearRequests` never deletes sessions; delete them from the Sessions tab.

**Debug builds only.** Sessions use native capture, which only runs in debug builds (iOS `DEBUG`, Android library debug variant). Release builds, and Android variants using the no-op artifact, cannot record or store sessions.

**Where the files live.** Sessions are saved on the device only, in a private folder excluded from backups: `Library/Application Support/network-tools/sessions/` on iOS and `no_backup/network-tools/sessions/` on Android. Nothing is sent off the device. Bodies are stored as captured, so they may contain personal data or tokens even when headers are redacted. The format is documented in [docs/SESSION_FILE_FORMAT.md](docs/SESSION_FILE_FORMAT.md).

To read session state in your own UI, use `useSessions()` (see the API reference).

---

## API Reference

### `NetworkMonitorProvider`

React context provider. Renders the floating monitor and manages request state.

### `useNetworkMonitor()`

Returns `{ requests, clearRequests, getRequestById, addRequest, annotateRequestError }`.

### `useSessions()`

Returns session state and actions: `{ availability, activeSession, activeRequests, sessions, startSession, stopSession, refreshSessions, getSessionSummaries, getSessionRequest, deleteSession, clearSessions }`. `availability` is `'available'`, `'capture-inactive'` or `'native-unavailable'`.

### Low-level native API

```ts
import {
  getAllNetworkRequests, // returns JSON string of all requests
  getNetworkRequestById, // returns JSON string of one request
  clearNetworkRequests, // clears native storage
  getNetworkRequestCount, // returns number
  isNativeNetworkToolsAvailable, // boolean
  getNetworkToolsRuntime, // 'turbo' | 'legacy' | 'unavailable'
} from 'react-native-network-tools';
```

### `NetworkRequest` type

```ts
type NetworkRequest = {
  id: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  requestTime: number;
  responseCode: number;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  responseTime: number;
  duration: number;
  error?: string;
  customError?: {
    message: string;
    code?: string;
    type: 'http' | 'validation' | 'custom';
    details?: unknown;
    source: 'react-native';
    timestamp: number;
  };
  requestBodyTruncated?: boolean; // body cut at maxBodyCaptureBytes
  responseBodyTruncated?: boolean;
  requestBodyEncoding?: 'utf8' | 'omitted'; // 'omitted': binary or not UTF-8, no text kept
  responseBodyEncoding?: 'utf8' | 'omitted';
  requestContentType?: string;
  responseContentType?: string;
  redactedRequestHeaders?: string[]; // names of headers whose values were redacted
  redactedResponseHeaders?: string[];
};
```

---

## Build configuration

### Recommended: no-op artifact (zero production footprint)

Follow the [Android setup](#android--hook-the-interceptor) instructions to include `react-native-network-tools-no-op` as your `releaseImplementation`. This ensures no library bytecode ships in your production APK — no `NetworkToolsInterceptor`, no `NetworkRequestStorage`, no `NetworkToolsEventEmitter`.

### Alternative: `BuildConfig` flag only

If you cannot use the no-op artifact, you can suppress runtime activity via a build config field. The library classes will still be compiled into the release APK but will be dormant:

```gradle
// android/app/build.gradle
buildTypes {
  debug {
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "true"
  }
  release {
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "false"
  }
}
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
