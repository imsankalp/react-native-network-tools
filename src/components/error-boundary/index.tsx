import React from 'react';
import { reportError } from '../../util/reportError';

export class NetworkLoggerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  {}
> {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError({ error, context: { reactStack: info.componentStack } });
  }

  render() {
    return this.props.children;
  }
}
