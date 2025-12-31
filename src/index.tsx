import {
  NetworkMonitorProvider,
  useNetworkMonitor,
} from './context/NetworkMonitorContext';

export { NetworkMonitorProvider, useNetworkMonitor };

// /**
//  * Get all captured network requests
//  * @template T - Type of the request/response data (defaults to any)
//  * @returns Array of NetworkRequest objects with typed data
//  */
// export function getAllRequests<T = any>(): Array<NetworkRequest<T>> {
//   const jsonString = NetworkTools.getAllRequests();
//   try {
//     return JSON.parse(jsonString) as Array<NetworkRequest<T>>;
//   } catch (e) {
//     return [];
//   }
// }

// /**
//  * Get a specific network request by ID
//  * @template T - Type of the request/response data (defaults to any)
//  * @param id - The unique identifier of the request
//  * @returns NetworkRequest object with typed data or null if not found
//  */
// export function getRequestById<T = any>(id: string): NetworkRequest<T> | null {
//   const jsonString = NetworkTools.getRequestById(id);
//   try {
//     const parsed = JSON.parse(jsonString);
//     return Object.keys(parsed).length > 0 ? (parsed as NetworkRequest<T>) : null;
//   } catch (e) {
//     return null;
//   }
// }

// /**
//  * Clear all stored network requests
//  */
// export function clearAllRequests(): void {
//   NetworkTools.clearAllRequests();
// }

// /**
//  * Get the count of stored network requests
//  * @returns Number of stored requests
//  */
// export function getRequestCount(): number {
//   return NetworkTools.getRequestCount();
// }

// src/index.tsx
import NetworkTools from './NativeNetworkTools';
import { NetworkLoggerErrorBoundary } from './components/error-boundary';
import { reportError, subscribeToErrors } from './util/reportError';
import useErrorSubscription from './util/useErrorSubscription';
import type {
  NetworkRequest,
  NetworkToolsProviderProps,
  NetworkLoggerOverlayProps,
  UseNetworkLoggerOptions,
  UseNetworkLoggerResult,
  AppError,
  Listener,
  ReportErrorPropType,
} from './types';

// Core API
export function enableNetworkLogging(): void {
  console.warn(
    'enableNetworkLogging() called outside of NetworkMonitorProvider. Please wrap your app with NetworkMonitorProvider.'
  );
}

export function disableNetworkLogging(): void {
  console.warn(
    'disableNetworkLogging() called outside of NetworkMonitorProvider. Please wrap your app with NetworkMonitorProvider.'
  );
}

export function isNetworkLoggingEnabled(): boolean {
  console.warn(
    'isNetworkLoggingEnabled() called outside of NetworkMonitorProvider. Please wrap your app with NetworkMonitorProvider.'
  );
  return false;
}

export const getAllNetworkRequests = (): string =>
  NetworkTools.getAllRequests();
export const getNetworkRequestById = (id: string): string =>
  NetworkTools.getRequestById(id);
export const clearNetworkRequests = (): void => NetworkTools.clearAllRequests();
export const getNetworkRequestCount = (): number =>
  NetworkTools.getRequestCount();

// Error handling
export {
  reportError,
  subscribeToErrors,
  useErrorSubscription,
  NetworkLoggerErrorBoundary,
};

export { default as FloatingNetworkMonitor } from './components/floating-network-monitor';

// Types
export type {
  NetworkRequest,
  AppError,
  Listener,
  ReportErrorPropType,
  NetworkLoggerOverlayProps,
  NetworkToolsProviderProps,
  UseNetworkLoggerOptions,
  UseNetworkLoggerResult,
};

// Default export for backward compatibility
const ReactNativeNetworkTools = {
  enable: enableNetworkLogging,
  disable: disableNetworkLogging,
  isEnabled: isNetworkLoggingEnabled,
  getAllRequests: getAllNetworkRequests,
  getRequestById: getNetworkRequestById,
  clearAllRequests: clearNetworkRequests,
  getRequestCount: getNetworkRequestCount,
  reportError,
  subscribeToErrors,
  useErrorSubscription,
  NetworkLoggerErrorBoundary,
};

export default ReactNativeNetworkTools;
