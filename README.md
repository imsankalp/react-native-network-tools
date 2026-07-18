# react-native-network-tools

Inspect all network requests in your React Native app via a floating overlay. Zero overhead in production — tracking only runs in debug mode.

![](Screen_recording_20260204_002905.mp4)

## Platform Support

| Platform | Status |
|---|---|
| React Native Android (New Architecture) | ✅ |
| React Native Android (Old Architecture) | ✅ |
| React Native iOS (New Architecture) | ✅ |
| React Native iOS (Old Architecture) | ✅ |
| Expo Development Build | ✅ |
| Expo Go | ❌ Requires a dev build |

---

## Installation

```sh
npm install react-native-network-tools
# or
yarn add react-native-network-tools
```

**Required peer dependencies:**

```sh
yarn add react-native-gesture-handler react-native-reanimated react-native-safe-area-context
```

---

## Setup

### Android — hook the interceptor

In `MainApplication.kt`, register the OkHttp interceptor **before** any requests are made:

```kotlin
import com.facebook.react.modules.network.NetworkingModule
import com.networktools.NetworkToolsManager
import okhttp3.OkHttpClient

class MainApplication : Application(), ReactApplication {

  override fun onCreate() {
    super.onCreate()

    if (BuildConfig.DEBUG) {
      NetworkingModule.setCustomClientBuilder(
        object : NetworkingModule.CustomClientBuilder {
          override fun apply(builder: OkHttpClient.Builder) {
            NetworkToolsManager.addInterceptor(builder)
          }
        }
      )
    }

    // rest of your setup
  }
}
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

Wrap your root component with `NetworkMonitorProvider`. The floating monitor button is shown by default.

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NetworkMonitorProvider } from 'react-native-network-tools';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NetworkMonitorProvider maxRequests={1000} showFloatingMonitor={true}>
          {/* your app */}
        </NetworkMonitorProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

`NetworkMonitorProvider` props:

| Prop | Type | Default | Description |
|---|---|---|---|
| `maxRequests` | `number` | `1000` | Max requests kept in memory (FIFO eviction) |
| `showFloatingMonitor` | `boolean` | `true` | Whether to render the draggable overlay button |

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
  type: 'validation',   // 'http' | 'validation' | 'custom'
  code: 'EMAIL_REQUIRED',
});
```

---

## API Reference

### `NetworkMonitorProvider`

React context provider. Renders the floating monitor and manages request state.

### `useNetworkMonitor()`

Returns `{ requests, clearRequests, getRequestById, addRequest, annotateRequestError }`.

### `FloatingNetworkMonitor`

The draggable overlay component. Rendered automatically by `NetworkMonitorProvider` when `showFloatingMonitor={true}`. Import and render it yourself if you need manual placement:

```tsx
import { FloatingNetworkMonitor } from 'react-native-network-tools';
```

### Low-level native API

```ts
import {
  getAllNetworkRequests,   // returns JSON string of all requests
  getNetworkRequestById,  // returns JSON string of one request
  clearNetworkRequests,   // clears native storage
  getNetworkRequestCount, // returns number
  isNativeNetworkToolsAvailable,  // boolean
  getNetworkToolsRuntime,         // 'turbo' | 'legacy' | 'unavailable'
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
};
```

---

## Build configuration

Tracking is enabled only when `BuildConfig.NETWORK_TOOLS_ENABLED` is `true`. Override per build type in `android/app/build.gradle`:

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

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
