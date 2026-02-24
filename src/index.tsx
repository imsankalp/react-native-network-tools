import {
  NetworkMonitorProvider,
  useNetworkMonitor,
} from './context/NetworkMonitorContext';
import type { AnnotateNetworkRequestErrorInput } from './context/types';
import { networkStore } from './store/NetworkStore';

export { NetworkMonitorProvider, useNetworkMonitor };

// Native module direct access (for advanced usage)
import NetworkTools from './NativeNetworkTools';
export const getAllNetworkRequests = (): string =>
  NetworkTools.getAllRequests();
export const getNetworkRequestById = (id: string): string =>
  NetworkTools.getRequestById(id);
export const clearNetworkRequests = (): void => NetworkTools.clearAllRequests();
export const getNetworkRequestCount = (): number =>
  NetworkTools.getRequestCount();
export const annotateNetworkRequestError = (
  input: AnnotateNetworkRequestErrorInput
): string | null => networkStore.annotateRequestError(input);

// Error handling
import { NetworkLoggerErrorBoundary } from './components/error-boundary';
import { reportError, subscribeToErrors } from './util/reportError';
import useErrorSubscription from './util/useErrorSubscription';

export {
  reportError,
  subscribeToErrors,
  useErrorSubscription,
  NetworkLoggerErrorBoundary,
};

// Components
export { default as FloatingNetworkMonitor } from './components/floating-network-monitor';

// Store (for advanced usage)
export { networkStore };

// Types
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

// Context types
import type {
  NetworkRequest as ContextNetworkRequest,
  NetworkMonitorContextType,
  NetworkMonitorProviderProps,
} from './context/types';

export type {
  AnnotateNetworkRequestErrorInput,
  ContextNetworkRequest,
  NetworkMonitorContextType,
  NetworkMonitorProviderProps,
};

// Default export for backward compatibility
const ReactNativeNetworkTools = {
  getAllRequests: getAllNetworkRequests,
  getRequestById: getNetworkRequestById,
  clearAllRequests: clearNetworkRequests,
  getRequestCount: getNetworkRequestCount,
  annotateNetworkRequestError,
  reportError,
  subscribeToErrors,
  useErrorSubscription,
  NetworkLoggerErrorBoundary,
  NetworkMonitorProvider,
  useNetworkMonitor,
};

export default ReactNativeNetworkTools;
