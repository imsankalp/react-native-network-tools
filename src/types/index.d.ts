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
  getAllRequests: () => NetworkRequest[];
  getRequestById: (id: string) => NetworkRequest | null;
  clearAllRequests: () => void;
  getRequestCount: () => number;
}

export interface NetworkToolsProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, context?: Record<string, any>) => void;
}

export interface NetworkLoggerOverlayProps {
  visible: boolean;
  onClose: () => void;
  maxRequests?: number;
}

export interface UseNetworkLoggerOptions {
  maxRequests?: number;
}

export interface UseNetworkLoggerResult {
  requests: NetworkRequest[];
  clear: () => void;
  getRequest: (id: string) => NetworkRequest | null;
  getRequestCount: () => number;
}

export * from './reanimated'; // If you have Reanimated specific types
