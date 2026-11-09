import { useSyncExternalStore } from 'react';
import { sessionStore } from '../store/SessionStore';
import type { UseSessionsResult } from '../context/types';

export function useSessions(): UseSessionsResult {
  const state = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getState,
    sessionStore.getState
  );
  return {
    ...state,
    startSession: sessionStore.start,
    stopSession: sessionStore.stop,
    refreshSessions: sessionStore.refreshSessions,
    getSessionSummaries: sessionStore.getSessionSummaries,
    getSessionRequest: sessionStore.getSessionRequest,
    deleteSession: sessionStore.deleteSession,
    clearSessions: sessionStore.clearSessions,
  };
}
