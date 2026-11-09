import {
  NativeModules,
  TurboModuleRegistry,
  type TurboModule,
} from 'react-native';

export interface Spec extends TurboModule {
  getAllRequests(): string;
  getRequestById(id: string): string;
  clearAllRequests(): void;
  getRequestCount(): number;
  setMaxBodyCaptureBytes(bytes: number): void;
  setRedactHeaders(headers: string[]): void;
  setMaxRequests(max: number): void;
  isCaptureActive(): boolean;
  /** Active session JSON, or "" when refused. */
  startSession(): string;
  /** Saved index entry JSON, or "" when nothing was recording. */
  stopSession(): Promise<string>;
  /** Active session JSON, or "" when not recording. */
  getActiveSession(): string;
  getActiveSessionSummaries(): string;
  listSessions(): Promise<string>;
  getSessionSummaries(sessionId: string): Promise<string>;
  /** Request line JSON, or "" when not found. */
  getSessionRequest(sessionId: string, requestId: string): Promise<string>;
  deleteSession(sessionId: string): Promise<void>;
  clearSessions(): Promise<void>;
  addListener(eventType: string): void;
  removeListeners(count: number): void;
}

type NetworkToolsRuntime = 'turbo' | 'legacy' | 'unavailable';

const TURBO_MODULE_NAME = 'NetworkTools';
const LEGACY_MODULE_NAME = 'NetworkToolsLegacy';

const turboModule = TurboModuleRegistry.get<Spec>('NetworkTools');
const legacyModule = (NativeModules[TURBO_MODULE_NAME] ??
  NativeModules[LEGACY_MODULE_NAME]) as Spec | undefined;

let hasWarnedUnavailable = false;

const warnUnavailable = (methodName: keyof Spec): void => {
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

  if (!isDev || hasWarnedUnavailable) {
    return;
  }

  hasWarnedUnavailable = true;
  console.warn(
    `[react-native-network-tools] Native module is unavailable. ` +
      `\`${String(methodName)}\` returned a safe fallback value. ` +
      `Expo Go is not supported; use an Expo Development Build or React Native CLI app.`
  );
};

const unavailableModule: Spec = {
  getAllRequests() {
    warnUnavailable('getAllRequests');
    return '[]';
  },
  getRequestById() {
    warnUnavailable('getRequestById');
    return '{}';
  },
  clearAllRequests() {
    warnUnavailable('clearAllRequests');
  },
  getRequestCount() {
    warnUnavailable('getRequestCount');
    return 0;
  },
  setMaxBodyCaptureBytes() {
    warnUnavailable('setMaxBodyCaptureBytes');
  },
  setRedactHeaders() {
    warnUnavailable('setRedactHeaders');
  },
  setMaxRequests() {
    warnUnavailable('setMaxRequests');
  },
  isCaptureActive() {
    warnUnavailable('isCaptureActive');
    return false;
  },
  startSession() {
    warnUnavailable('startSession');
    return '';
  },
  stopSession() {
    warnUnavailable('stopSession');
    return Promise.resolve('');
  },
  getActiveSession() {
    warnUnavailable('getActiveSession');
    return '';
  },
  getActiveSessionSummaries() {
    warnUnavailable('getActiveSessionSummaries');
    return '[]';
  },
  listSessions() {
    warnUnavailable('listSessions');
    return Promise.resolve('[]');
  },
  getSessionSummaries() {
    warnUnavailable('getSessionSummaries');
    return Promise.resolve('[]');
  },
  getSessionRequest() {
    warnUnavailable('getSessionRequest');
    return Promise.resolve('');
  },
  deleteSession() {
    warnUnavailable('deleteSession');
    return Promise.resolve();
  },
  clearSessions() {
    warnUnavailable('clearSessions');
    return Promise.resolve();
  },
  addListener() {
    warnUnavailable('addListener');
  },
  removeListeners() {
    warnUnavailable('removeListeners');
  },
};

export const getNetworkToolsRuntime = (): NetworkToolsRuntime => {
  if (turboModule) {
    return 'turbo';
  }
  if (legacyModule) {
    return 'legacy';
  }
  return 'unavailable';
};

export const isNativeNetworkToolsAvailable = (): boolean =>
  getNetworkToolsRuntime() !== 'unavailable';

const NetworkTools: Spec = turboModule ?? legacyModule ?? unavailableModule;

export type { NetworkToolsRuntime };

export default NetworkTools;
