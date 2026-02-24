# react-native-network-tools

A powerful React Native library that allows you to track and inspect all network requests in your app. Perfect for debugging, monitoring, and understanding your app's network behavior.

## Features

- 🔍 **Automatic Request Tracking**: Captures all OkHttp network requests automatically
- 🐛 **Debug-Only**: Zero overhead in production builds (only active in debug mode)
- 📊 **Detailed Information**: Captures request/response headers, bodies, timing, and errors
- 💾 **In-Memory Storage**: Stores up to 100 recent requests with automatic cleanup
- 🔒 **Thread-Safe**: Built with concurrent data structures for reliability
- ⚡ **Easy Integration**: Simple API with minimal setup required

## Installation

```sh
npm install react-native-network-tools
# or
yarn add react-native-network-tools
```

## Quick Start

### 1. Configure OkHttpClient (Android)

Add the interceptor to your `MainApplication.kt`:

```kotlin
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

    // rest code
  }
}
```

### 2. Wrap Your App with NetworkMonitorProvider

```typescript
import { NetworkMonitorProvider } from 'react-native-network-tools';

function App() {
  return (
    <NetworkMonitorProvider
      maxRequests={1000}
      showFloatingMonitor={true}
    >
      {/* Your app code */}
    </NetworkMonitorProvider>
  );
}
```

### 3. View Network Requests

```typescript
import * as NetworkTools from 'react-native-network-tools';

// Get all requests
const requests = NetworkTools.getAllRequests();

// Get specific request
const request = NetworkTools.getRequestById('request-id');

// Clear all requests
NetworkTools.clearAllRequests();

// Get request count
const count = NetworkTools.getRequestCount();
```

## API Reference

### `getAllRequests(): NetworkRequest[]`
Get all captured network requests.

### `getRequestById(id: string): NetworkRequest | null`
Get a specific network request by its unique ID.

### `clearAllRequests(): void`
Clear all stored network requests from memory.

### `getRequestCount(): number`
Get the total count of stored network requests.

## NetworkRequest Type

```typescript
interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  requestTime: number;
  responseCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  responseTime?: number;
  duration?: number;
  error?: string;
}
```

## Build Configuration

The library automatically enables tracking only in debug builds. You can customize this behavior:

```gradle
buildTypes {
  debug {
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "true"
  }
  staging {
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "true"
  }
  release {
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "false"
  }
}
```

## Advanced Usage

For detailed setup instructions, custom configurations, and advanced usage patterns, see the [Setup Guide](SETUP_GUIDE.md).

## Platform Support

- ✅ Android (via OkHttp interceptor)
- 🚧 iOS (coming soon)

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
