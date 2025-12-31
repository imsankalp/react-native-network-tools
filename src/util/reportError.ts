// errorStore.ts

import type { AppError, Listener, ReportErrorPropType } from './types';

const errors: AppError[] = [];
const listeners = new Set<Listener>();

export function reportError({ error, context }: ReportErrorPropType) {
  const entry: AppError = {
    id: Math.random().toString(36),
    error,
    context,
    timestamp: Date.now(),
  };

  errors.push(entry);
  listeners.forEach((Listener) => Listener([...errors]));
}

export function notifyListeners() {
  const snapshot = [...errors];
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeToErrors(listener: Listener) {
  listeners.add(listener);
  listener([...errors]);

  return () => listeners.delete(listener);
}
