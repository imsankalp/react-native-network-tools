import React from 'react';
import { NetworkLoggerErrorBoundary } from '../components/error-boundary';

export function NetworkLoggerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NetworkLoggerErrorBoundary>
      {children}
      {/* <ErrorOverlay /> */}
    </NetworkLoggerErrorBoundary>
  );
}
