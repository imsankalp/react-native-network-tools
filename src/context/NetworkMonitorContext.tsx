import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  View,
  StyleSheet,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import FloatingNetworkMonitor from '../components/floating-network-monitor';

const { NetworkTools } = NativeModules;

type NetworkRequest = {
  id: string;
  url: string;
  method: string;
  status: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestData?: any;
  responseData?: any;
  timestamp: number;
  duration: number;
  error?: string;
};

type NetworkMonitorContextType = {
  isEnabled: boolean;
  requests: NetworkRequest[];
  enable: () => void;
  disable: () => void;
  addRequest: (
    request: Omit<NetworkRequest, 'id' | 'timestamp' | 'duration'>
  ) => void;
  clearRequests: () => void;
};

const NetworkMonitorContext = createContext<
  NetworkMonitorContextType | undefined
>(undefined);

interface NetworkMonitorProviderProps {
  children: ReactNode;
  enabledByDefault?: boolean;
}

export const NetworkMonitorProvider: React.FC<NetworkMonitorProviderProps> = ({
  children,
  enabledByDefault = false,
}) => {
  const [isEnabled, setIsEnabled] = useState(
    NetworkTools?.isEnabled?.() ?? enabledByDefault
  );
  const [requests, setRequests] = useState<NetworkRequest[]>([]);

  const enable = useCallback(() => {
    if (NetworkTools?.enable) {
      NetworkTools.enable();
    }
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    if (NetworkTools?.disable) {
      NetworkTools.disable();
    }
    setIsEnabled(false);
  }, []);

  const addRequest = useCallback(
    (request: Omit<NetworkRequest, 'id' | 'timestamp' | 'duration'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const timestamp = Date.now();

      setRequests((prev) =>
        [
          {
            ...request,
            id,
            timestamp,
            duration: 0, // Will be updated when response is received
          },
          ...prev,
        ].slice(0, 1000)
      ); // Limit to 1000 most recent requests
    },
    []
  );

  // const updateRequest = useCallback((id: string, updates: Partial<NetworkRequest>) => {
  //   setRequests(prev =>
  //     prev.map(req =>
  //       req.id === id ? { ...req, ...updates } : req
  //     )
  //   );
  const clearRequests = useCallback(() => {
    setRequests([]);
  }, []);

  // Sync with native module on mount
  useEffect(() => {
    if (Platform.OS === 'ios' || !NetworkTools) return undefined;

    // Set initial state from native
    if (typeof NetworkTools.isEnabled === 'function') {
      const nativeEnabled = NetworkTools.isEnabled();
      if (nativeEnabled !== isEnabled) {
        setIsEnabled(nativeEnabled);
      }
    }

    // Listen for native state changes
    const eventEmitter = new NativeEventEmitter(NetworkTools);
    const subscription = eventEmitter.addListener(
      'onNetworkLoggingStateChanged',
      (event: unknown) => {
        // Safely check if the event has the expected shape
        if (
          event &&
          typeof event === 'object' &&
          'enabled' in event &&
          typeof (event as { enabled: unknown }).enabled === 'boolean'
        ) {
          setIsEnabled((event as { enabled: boolean }).enabled);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isEnabled]);

  // Update the global functions to use our context
  useEffect(() => {
    // @ts-ignore - Adding to global scope for backward compatibility
    globalThis.ReactNativeNetworkTools = {
      enableNetworkLogging: enable,
      disableNetworkLogging: disable,
      isNetworkLoggingEnabled: () => isEnabled,
    };
  }, [enable, disable, isEnabled]);
  console.log('NetworkMonitorProvider rendered, isEnabled:', isEnabled);

  return (
    <NetworkMonitorContext.Provider
      value={{
        isEnabled,
        requests,
        enable,
        disable,
        addRequest,
        clearRequests,
      }}
    >
      {children}
      {isEnabled && (
        <View style={styles.floatingContainer} pointerEvents="box-none">
          <FloatingNetworkMonitor isEnabled={isEnabled} />
        </View>
      )}
    </NetworkMonitorContext.Provider>
  );
};

export const useNetworkMonitor = (): NetworkMonitorContextType => {
  const context = useContext(NetworkMonitorContext);
  if (context === undefined) {
    throw new Error(
      'useNetworkMonitor must be used within a NetworkMonitorProvider'
    );
  }
  return context;
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
});

export default NetworkMonitorContext;
