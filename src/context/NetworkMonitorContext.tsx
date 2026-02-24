import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { View, StyleSheet, NativeEventEmitter, Platform } from 'react-native';
import FloatingNetworkMonitor from '../components/floating-network-monitor';
import NetworkTools from '../NativeNetworkTools';
import { networkStore } from '../store/NetworkStore';
import type {
  AnnotateNetworkRequestErrorInput,
  NetworkMonitorContextType,
  NetworkMonitorProviderProps,
  NetworkRequest,
} from './types';

const NetworkMonitorContext = createContext<
  NetworkMonitorContextType | undefined
>(undefined);

const NETWORK_EVENT_NAME = 'NetworkTools:onRequest';

export const NetworkMonitorProvider: React.FC<NetworkMonitorProviderProps> = ({
  children,
  maxRequests = 1000,
  showFloatingMonitor = true,
}) => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const emitterRef = useRef<NativeEventEmitter | null>(null);

  // Configure store max requests
  useEffect(() => {
    networkStore.setMaxRequests(maxRequests);
  }, [maxRequests]);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = networkStore.subscribe((updatedRequests) => {
      setRequests(updatedRequests);
    });

    return unsubscribe;
  }, []);

  const addRequest = useCallback((request: NetworkRequest) => {
    networkStore.add(request);
  }, []);

  const clearRequests = useCallback(() => {
    networkStore.clear();
    if (NetworkTools?.clearAllRequests) {
      NetworkTools.clearAllRequests();
    }
  }, []);

  const getRequestById = useCallback((id: string): NetworkRequest | null => {
    return networkStore.getById(id);
  }, []);

  const annotateRequestError = useCallback(
    (input: AnnotateNetworkRequestErrorInput): string | null => {
      return networkStore.annotateRequestError(input);
    },
    []
  );

  // Initialize event emitter and listeners
  useEffect(() => {
    if (!NetworkTools || Platform.OS === 'web') return;

    // Initialize emitter
    emitterRef.current = new NativeEventEmitter(NetworkTools);

    // Load existing requests from native
    if (typeof NetworkTools.getAllRequests === 'function') {
      try {
        const existingRequestsJson = NetworkTools.getAllRequests();
        if (existingRequestsJson) {
          const existingRequests = JSON.parse(existingRequestsJson);
          if (Array.isArray(existingRequests) && existingRequests.length > 0) {
            networkStore.loadInitialData(existingRequests);
          }
        }
      } catch (error) {
        console.warn('Failed to load existing network requests:', error);
      }
    }

    // Listen for new network requests
    const subscription = emitterRef.current.addListener(
      NETWORK_EVENT_NAME,
      (networkRequest: any) => {
        if (networkRequest && typeof networkRequest === 'object') {
          networkStore.add(networkRequest as NetworkRequest);
        }
      }
    );
    return () => {
      subscription?.remove();
      emitterRef.current?.removeAllListeners(NETWORK_EVENT_NAME);
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      requests,
      addRequest,
      clearRequests,
      getRequestById,
      annotateRequestError,
    }),
    [requests, addRequest, clearRequests, getRequestById, annotateRequestError]
  );

  return (
    <NetworkMonitorContext.Provider value={contextValue}>
      {children}
      {showFloatingMonitor && (
        <View style={styles.floatingContainer} pointerEvents="box-none">
          <FloatingNetworkMonitor />
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
    zIndex: 9999,
  },
});

export default NetworkMonitorContext;
