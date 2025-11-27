# Quick Start Guide

Get up and running with react-native-network-tools in 5 minutes.

## Installation

```bash
npm install react-native-network-tools
# or
yarn add react-native-network-tools
```

## Android Setup (2 steps)

### Step 1: Add Interceptor to OkHttpClient

Edit `android/app/src/main/java/com/yourapp/MainApplication.kt`:

```kotlin
// Add these imports
import com.networktools.NetworkToolsManager 
import com.facebook.react.modules.network.NetworkingModule
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

### Step 2: Enable in Your App

In your main App component:

```typescript
import { useEffect } from 'react';
import * as NetworkTools from 'react-native-network-tools';

function App() {
  useEffect(() => {
    NetworkTools.enable();
  }, []);

  return (
    // Your app content
  );
}
```

## That's it! 🎉

All network requests are now being tracked. View them with:

```typescript
const requests = NetworkTools.getAllRequests();
console.log('Captured requests:', requests);
```

## Common Use Cases

### View All Requests

```typescript
import * as NetworkTools from 'react-native-network-tools';

const requests = NetworkTools.getAllRequests();
requests.forEach(req => {
  console.log(`${req.method} ${req.url} - ${req.responseCode}`);
});
```

### Clear Requests

```typescript
NetworkTools.clearAllRequests();
```

### Check Request Count

```typescript
const count = NetworkTools.getRequestCount();
console.log(`Total requests: ${count}`);
```

### Get Specific Request

```typescript
const request = NetworkTools.getRequestById('request-id');
if (request) {
  console.log('Request:', request);
}
```

## Add a Debug Button

```typescript
import { Button } from 'react-native';
import * as NetworkTools from 'react-native-network-tools';

function DebugScreen() {
  const showNetworkLogs = () => {
    const requests = NetworkTools.getAllRequests();
    console.log('Network Requests:', JSON.stringify(requests, null, 2));
  };

  return (
    <Button title="Show Network Logs" onPress={showNetworkLogs} />
  );
}
```

## Important Notes

✅ **Only works in debug builds** - Zero overhead in production  
✅ **Stores last 100 requests** - Automatically cleans up old requests  
✅ **Thread-safe** - Safe to use from any thread  
✅ **No configuration needed** - Works out of the box  

## Next Steps

- [Full Setup Guide](SETUP_GUIDE.md) - Detailed configuration options
- [Integration Examples](INTEGRATION_EXAMPLES.md) - Examples with popular libraries
- [Architecture](ARCHITECTURE.md) - How it works under the hood

## Troubleshooting

**Requests not appearing?**
1. Check that `NetworkTools.enable()` is called
2. Verify you're running a debug build
3. Make sure the interceptor is added to OkHttpClient

**Need help?**
- [Open an issue](https://github.com/imsankalp/react-native-network-tools/issues)
- Check the [full documentation](README.md)
