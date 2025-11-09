# Network Tools Setup Guide

This guide explains how to integrate the OkHttp interceptor to track network requests in your React Native app.

## Overview

The library uses an OkHttp interceptor to capture all network requests made by your Android app. The interceptor is **only active in debug builds** by default, ensuring zero overhead in production.

## Strategy: Build Type Configuration

The library uses Android build types (debug/release) to control when network tracking is active:

- **Debug builds**: Network tracking is enabled
- **Release builds**: Network tracking is disabled (zero overhead)

This is controlled via `BuildConfig.NETWORK_TOOLS_ENABLED` which is automatically set based on the build type.

## Installation Steps

### 1. Install the Package

```bash
npm install react-native-network-tools
# or
yarn add react-native-network-tools
```

### 2. Configure OkHttpClient

You need to add the NetworkTools interceptor to your OkHttpClient. This is typically done in your React Native app's native Android code.

#### Option A: Using React Native's Default OkHttpClient

If you're using React Native's default networking (fetch), you'll need to customize the OkHttpClient in your `MainApplication.kt` or `MainApplication.java`:

**Kotlin:**

```kotlin
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.networktools.NetworkToolsManager
import okhttp3.OkHttpClient

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      // ... other configurations

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      // Override to customize OkHttpClient
      override fun createOkHttpClientBuilder(): OkHttpClient.Builder {
        val builder = super.createOkHttpClientBuilder()
        // Add NetworkTools interceptor
        NetworkToolsManager.addInterceptor(builder)
        return builder
      }
    }
}
```

**Java:**

```java
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.networktools.NetworkToolsManager;
import okhttp3.OkHttpClient;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
    new DefaultReactNativeHost(this) {
      // ... other configurations

      @Override
      public boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
      }

      @Override
      protected OkHttpClient.Builder createOkHttpClientBuilder() {
        OkHttpClient.Builder builder = super.createOkHttpClientBuilder();
        // Add NetworkTools interceptor
        NetworkToolsManager.addInterceptor(builder);
        return builder;
      }
    };
}
```

#### Option B: Using Custom OkHttpClient

If you're creating your own OkHttpClient instances (e.g., for libraries like Axios with native adapter):

```kotlin
import com.networktools.NetworkToolsManager
import okhttp3.OkHttpClient

val client = OkHttpClient.Builder()
  .apply { NetworkToolsManager.addInterceptor(this) }
  .connectTimeout(30, TimeUnit.SECONDS)
  .readTimeout(30, TimeUnit.SECONDS)
  .build()
```

### 3. Enable Network Tracking in Your App

In your React Native JavaScript/TypeScript code, enable tracking during app initialization:

```typescript
import { useEffect } from 'react';
import * as NetworkTools from 'react-native-network-tools';

function App() {
  useEffect(() => {
    // Enable network tracking
    NetworkTools.enable();
    
    // Optional: Check if it's enabled
    console.log('Network tracking enabled:', NetworkTools.isEnabled());
  }, []);

  return (
    // Your app content
  );
}
```

## Usage Examples

### Get All Network Requests

```typescript
import * as NetworkTools from 'react-native-network-tools';

const requests = NetworkTools.getAllRequests();
console.log(`Captured ${requests.length} requests`);

requests.forEach(request => {
  console.log(`${request.method} ${request.url}`);
  console.log(`Status: ${request.responseCode}`);
  console.log(`Duration: ${request.duration}ms`);
});
```

### Get Request by ID

```typescript
const request = NetworkTools.getRequestById('some-request-id');
if (request) {
  console.log('Request details:', request);
}
```

### Clear All Requests

```typescript
NetworkTools.clearAllRequests();
console.log('All requests cleared');
```

### Get Request Count

```typescript
const count = NetworkTools.getRequestCount();
console.log(`Total requests: ${count}`);
```

## Build Configuration

### Custom Build Types

If you want to enable network tracking in custom build types, modify your library's `build.gradle`:

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

### Product Flavors

You can also control this via product flavors:

```gradle
flavorDimensions "environment"
productFlavors {
  dev {
    dimension "environment"
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "true"
  }
  prod {
    dimension "environment"
    buildConfigField "boolean", "NETWORK_TOOLS_ENABLED", "false"
  }
}
```

## Important Notes

1. **Performance**: The interceptor only runs in debug builds by default, so there's no performance impact in production.

2. **Storage**: Network requests are stored in memory with a limit of 100 requests. Older requests are automatically removed when the limit is exceeded.

3. **Security**: Be careful not to log sensitive data. The interceptor captures request/response bodies, so avoid using it with sensitive endpoints in production.

4. **Thread Safety**: The storage implementation is thread-safe using `ConcurrentLinkedQueue`.

## Troubleshooting

### Network requests not being captured

1. Verify that `NetworkTools.enable()` is called
2. Check that you're running a debug build
3. Ensure the interceptor is added to your OkHttpClient
4. Verify that your network library uses OkHttp (most React Native networking does)

### Build errors

1. Make sure you've added the OkHttp dependency (it should be included automatically)
2. Sync your Gradle files
3. Clean and rebuild your project

## Advanced Usage

### Manual Interceptor Management

If you need more control, you can manually get the interceptor:

```kotlin
val interceptor = NetworkToolsManager.getInterceptor()
if (interceptor != null) {
  client.addInterceptor(interceptor)
}
```

### Conditional Enabling

```typescript
// Enable only for specific users or conditions
if (__DEV__ && shouldEnableNetworkTracking) {
  NetworkTools.enable();
}
```
