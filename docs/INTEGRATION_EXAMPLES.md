# Integration Examples

This document provides practical examples of integrating react-native-network-tools with popular networking libraries and patterns.

## Table of Contents

- [React Native Fetch API](#react-native-fetch-api)
- [Axios](#axios)
- [React Query](#react-query)
- [Redux Toolkit (RTK Query)](#redux-toolkit-rtk-query)
- [Custom Network Layer](#custom-network-layer)
- [Building a Network Inspector UI](#building-a-network-inspector-ui)

## React Native Fetch API

The default `fetch` API in React Native uses OkHttp under the hood, so it will be automatically tracked once you configure the interceptor.

### Setup

```kotlin
// MainApplication.kt
import com.networktools.NetworkToolsManager

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun createOkHttpClientBuilder(): OkHttpClient.Builder {
        return super.createOkHttpClientBuilder()
          .apply { NetworkToolsManager.addInterceptor(this) }
      }
    }
}
```

### Usage

```typescript
import * as NetworkTools from 'react-native-network-tools';

// Enable tracking
NetworkTools.enable();

// Make requests as usual
fetch('https://api.example.com/users')
  .then(response => response.json())
  .then(data => {
    // View captured requests
    const requests = NetworkTools.getAllRequests();
    console.log('Captured requests:', requests);
  });
```

## Axios

If you're using Axios with a native adapter, you'll need to ensure it uses the configured OkHttpClient.

### Setup with Custom OkHttpClient

```kotlin
// Create a custom OkHttpClient provider
object NetworkClient {
  val okHttpClient: OkHttpClient by lazy {
    OkHttpClient.Builder()
      .apply { NetworkToolsManager.addInterceptor(this) }
      .connectTimeout(30, TimeUnit.SECONDS)
      .readTimeout(30, TimeUnit.SECONDS)
      .build()
  }
}
```

### TypeScript Usage

```typescript
import axios from 'axios';
import * as NetworkTools from 'react-native-network-tools';

NetworkTools.enable();

const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 30000,
});

// Make requests
api.get('/users').then(response => {
  const requests = NetworkTools.getAllRequests();
  console.log(`Captured ${requests.length} requests`);
});
```

## React Query

React Query works seamlessly with the network interceptor since it uses fetch or axios under the hood.

### Example

```typescript
import { useQuery } from '@tanstack/react-query';
import * as NetworkTools from 'react-native-network-tools';

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('https://api.example.com/users');
      return response.json();
    },
  });
}

function UsersScreen() {
  const { data, isLoading } = useUsers();
  
  const viewNetworkLogs = () => {
    const requests = NetworkTools.getAllRequests();
    console.log('Network requests:', requests);
  };

  return (
    <View>
      <Button title="View Network Logs" onPress={viewNetworkLogs} />
      {/* Render users */}
    </View>
  );
}
```

## Redux Toolkit (RTK Query)

RTK Query also works automatically with the interceptor.

### Example

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import * as NetworkTools from 'react-native-network-tools';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.example.com' }),
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => 'users',
    }),
  }),
});

export const { useGetUsersQuery } = api;

// In your component
function UsersScreen() {
  const { data } = useGetUsersQuery();
  
  useEffect(() => {
    NetworkTools.enable();
  }, []);

  const showNetworkLogs = () => {
    const requests = NetworkTools.getAllRequests();
    console.log('API requests:', requests);
  };

  return (
    <View>
      <Button title="Show Network Logs" onPress={showNetworkLogs} />
    </View>
  );
}
```

## Custom Network Layer

If you have a custom network layer, ensure it uses OkHttp and the configured client.

### Example

```kotlin
// NetworkModule.kt
object NetworkModule {
  private val okHttpClient: OkHttpClient by lazy {
    OkHttpClient.Builder()
      .apply { NetworkToolsManager.addInterceptor(this) }
      .addInterceptor(AuthInterceptor())
      .addInterceptor(LoggingInterceptor())
      .build()
  }

  fun provideOkHttpClient(): OkHttpClient = okHttpClient
}
```

## Building a Network Inspector UI

Here's a complete example of building a network inspector screen:

### NetworkInspectorScreen.tsx

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import * as NetworkTools from 'react-native-network-tools';
import type { NetworkRequest } from 'react-native-network-tools';

export function NetworkInspectorScreen() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 1000); // Refresh every second
    return () => clearInterval(interval);
  }, []);

  const loadRequests = () => {
    const allRequests = NetworkTools.getAllRequests();
    setRequests(allRequests.reverse()); // Show newest first
  };

  const clearAll = () => {
    NetworkTools.clearAllRequests();
    setRequests([]);
  };

  const viewDetails = (request: NetworkRequest) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const getStatusColor = (code?: number) => {
    if (!code) return '#999';
    if (code >= 200 && code < 300) return '#4CAF50';
    if (code >= 300 && code < 400) return '#FF9800';
    if (code >= 400) return '#F44336';
    return '#999';
  };

  const renderRequest = ({ item }: { item: NetworkRequest }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => viewDetails(item)}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.method}>{item.method}</Text>
        <Text
          style={[
            styles.statusCode,
            { color: getStatusColor(item.responseCode) },
          ]}
        >
          {item.responseCode || 'PENDING'}
        </Text>
      </View>
      <Text style={styles.url} numberOfLines={1}>
        {item.url}
      </Text>
      <View style={styles.requestFooter}>
        <Text style={styles.duration}>
          {item.duration ? `${item.duration}ms` : '-'}
        </Text>
        <Text style={styles.time}>
          {new Date(item.requestTime).toLocaleTimeString()}
        </Text>
      </View>
      {item.error && (
        <Text style={styles.error} numberOfLines={1}>
          Error: {item.error}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Inspector</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={loadRequests} style={styles.button}>
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll} style={styles.button}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.count}>
        Total Requests: {NetworkTools.getRequestCount()}
      </Text>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRequest && (
              <>
                <Section title="General">
                  <DetailRow label="Method" value={selectedRequest.method} />
                  <DetailRow label="URL" value={selectedRequest.url} />
                  <DetailRow
                    label="Status"
                    value={String(selectedRequest.responseCode || 'N/A')}
                  />
                  <DetailRow
                    label="Duration"
                    value={`${selectedRequest.duration || 0}ms`}
                  />
                </Section>

                <Section title="Request Headers">
                  {Object.entries(selectedRequest.requestHeaders).map(
                    ([key, value]) => (
                      <DetailRow key={key} label={key} value={value} />
                    )
                  )}
                </Section>

                {selectedRequest.requestBody && (
                  <Section title="Request Body">
                    <Text style={styles.bodyText}>
                      {selectedRequest.requestBody}
                    </Text>
                  </Section>
                )}

                {selectedRequest.responseHeaders && (
                  <Section title="Response Headers">
                    {Object.entries(selectedRequest.responseHeaders).map(
                      ([key, value]) => (
                        <DetailRow key={key} label={key} value={value} />
                      )
                    )}
                  </Section>
                )}

                {selectedRequest.responseBody && (
                  <Section title="Response Body">
                    <Text style={styles.bodyText}>
                      {selectedRequest.responseBody}
                    </Text>
                  </Section>
                )}

                {selectedRequest.error && (
                  <Section title="Error">
                    <Text style={styles.errorText}>
                      {selectedRequest.error}
                    </Text>
                  </Section>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  count: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  list: {
    padding: 8,
  },
  requestItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  method: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusCode: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  url: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  duration: {
    fontSize: 12,
    color: '#999',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  error: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    marginRight: 8,
    minWidth: 100,
  },
  detailValue: {
    flex: 1,
    color: '#666',
  },
  bodyText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
});
```

### Adding to Your App

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NetworkInspectorScreen } from './NetworkInspectorScreen';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Your other screens */}
        {__DEV__ && (
          <Stack.Screen
            name="NetworkInspector"
            component={NetworkInspectorScreen}
            options={{ title: 'Network Inspector' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Tips and Best Practices

1. **Only enable in development**: Always check `__DEV__` before enabling tracking
2. **Clear regularly**: Clear old requests to prevent memory buildup
3. **Sensitive data**: Be careful with endpoints that contain sensitive information
4. **Performance**: The interceptor is lightweight but still adds overhead - keep it debug-only
5. **UI feedback**: Build a UI to make it easy to view and debug network requests

## Troubleshooting

### Requests not appearing

1. Ensure `NetworkTools.enable()` is called
2. Verify you're in a debug build
3. Check that the interceptor is added to your OkHttpClient
4. Confirm your network library uses OkHttp

### Performance issues

1. Clear old requests regularly with `clearAllRequests()`
2. Ensure tracking is disabled in production builds
3. Consider reducing the storage limit if needed
