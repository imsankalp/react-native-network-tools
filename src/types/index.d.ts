import React from 'react';

export interface NetworkRequest<TRequest = any, TResponse = any> {
  id: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  response?: Response;
  requestData?: TRequest;
  responseData?: TResponse;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: Error;
}

export interface AppError {
  id: string;
  error: Error;
  context?: Record<string, any>;
  timestamp: number;
}

export type Listener<T = any> = (items: T[]) => void;

export interface ReportErrorPropType {
  error: Error;
  context?: Record<string, any>;
}

export interface NetworkToolsType {
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  getAllRequests: () => NetworkRequest[];
  getRequestById: (id: string) => NetworkRequest | null;
  clearAllRequests: () => void;
  getRequestCount: () => number;
}

export interface NetworkToolsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  onError?: (error: Error, context?: Record<string, any>) => void;
}

export interface NetworkLoggerOverlayProps {
  visible: boolean;
  onClose: () => void;
  maxRequests?: number;
}

export interface UseNetworkLoggerOptions {
  enabled?: boolean;
  maxRequests?: number;
}

export interface UseNetworkLoggerResult {
  requests: NetworkRequest[];
  clear: () => void;
  getRequest: (id: string) => NetworkRequest | null;
  getRequestCount: () => number;
}

export interface NetworkLogEntry {
  id: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: string;
  requestTime: number;
  responseCode: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  responseTime: number;
  duration: number;
  error: string;
}

export * from './reanimated'; // If you have Reanimated specific types
