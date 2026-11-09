import type { NativeEventEmitter } from 'react-native';
import NetworkTools, {
  isNativeNetworkToolsAvailable,
} from '../NativeNetworkTools';
import type {
  ActiveSession,
  SessionChangeEvent,
  SessionIndexEntry,
  SessionRequest,
  SessionRequestSummary,
  SessionsAvailability,
} from '../context/types';

export const SESSION_CHANGE_EVENT = 'NetworkTools:onSessionChange';

export type SessionState = {
  availability: SessionsAvailability;
  activeSession: ActiveSession | null;
  activeRequests: SessionRequestSummary[];
  sessions: SessionIndexEntry[];
};

type Listener = () => void;

type Subscription = { remove: () => void };
type SessionEventSource = Pick<NativeEventEmitter, 'addListener'>;

const INITIAL_STATE: SessionState = {
  availability: 'native-unavailable',
  activeSession: null,
  activeRequests: [],
  sessions: [],
};

function parseJson<T>(json: string, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function newestFirst(sessions: SessionIndexEntry[]): SessionIndexEntry[] {
  return [...sessions].sort((a, b) => b.startTime - a.startTime);
}

/** Thin JS view over the native session recorder and file store. */
class SessionStore {
  private state: SessionState = INITIAL_STATE;
  private listeners = new Set<Listener>();
  private subscription: Subscription | null = null;

  /** Reads native state (including a recording that survived a JS reload) and listens for changes. */
  init(events: SessionEventSource | null): void {
    this.dispose();

    const availability: SessionsAvailability = !isNativeNetworkToolsAvailable()
      ? 'native-unavailable'
      : NetworkTools.isCaptureActive()
        ? 'available'
        : 'capture-inactive';

    if (availability !== 'available') {
      this.setState({ ...INITIAL_STATE, availability });
      return;
    }

    this.setState({
      availability,
      activeSession: parseJson<ActiveSession | null>(
        NetworkTools.getActiveSession(),
        null
      ),
      activeRequests: parseJson<SessionRequestSummary[]>(
        NetworkTools.getActiveSessionSummaries(),
        []
      ),
      sessions: this.state.sessions,
    });

    this.subscription =
      events?.addListener(SESSION_CHANGE_EVENT, (event) =>
        this.handleEvent(event as unknown as SessionChangeEvent)
      ) ?? null;

    this.refreshSessions();
  }

  dispose(): void {
    this.subscription?.remove();
    this.subscription = null;
  }

  getState = (): SessionState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Starts a recording. Null if refused (already recording, or sessions unavailable). */
  start = (): ActiveSession | null => {
    if (this.state.availability !== 'available') return null;
    const session = parseJson<ActiveSession | null>(
      NetworkTools.startSession(),
      null
    );
    if (session) {
      this.setState({
        ...this.state,
        activeSession: session,
        activeRequests: [],
      });
    }
    return session;
  };

  /** Stops and saves the recording. Resolves with the stored entry, or null if nothing was saved. */
  stop = async (): Promise<SessionIndexEntry | null> => {
    if (this.state.availability !== 'available') return null;
    const entry = parseJson<SessionIndexEntry | null>(
      await NetworkTools.stopSession(),
      null
    );
    this.setState({ ...this.state, activeSession: null, activeRequests: [] });
    await this.refreshSessions();
    return entry;
  };

  refreshSessions = async (): Promise<void> => {
    if (this.state.availability !== 'available') return;
    const sessions = parseJson<SessionIndexEntry[]>(
      await NetworkTools.listSessions(),
      []
    );
    this.setState({ ...this.state, sessions: newestFirst(sessions) });
  };

  getSessionSummaries = async (
    sessionId: string
  ): Promise<SessionRequestSummary[]> => {
    if (this.state.availability !== 'available') return [];
    const summaries = parseJson<SessionRequestSummary[]>(
      await NetworkTools.getSessionSummaries(sessionId),
      []
    );
    return [...summaries].sort((a, b) => a.seq - b.seq);
  };

  getSessionRequest = async (
    sessionId: string,
    requestId: string
  ): Promise<SessionRequest | null> => {
    if (this.state.availability !== 'available') return null;
    return parseJson<SessionRequest | null>(
      await NetworkTools.getSessionRequest(sessionId, requestId),
      null
    );
  };

  deleteSession = async (sessionId: string): Promise<void> => {
    if (this.state.availability !== 'available') return;
    await NetworkTools.deleteSession(sessionId);
    await this.refreshSessions();
  };

  clearSessions = async (): Promise<void> => {
    if (this.state.availability !== 'available') return;
    await NetworkTools.clearSessions();
    await this.refreshSessions();
  };

  private handleEvent(event: SessionChangeEvent): void {
    switch (event.type) {
      case 'started':
        this.setState({
          ...this.state,
          activeSession: event.activeSession,
          activeRequests: [],
        });
        break;
      case 'request': {
        const added = event.addedRequest;
        const alreadyListed =
          added && this.state.activeRequests.some((r) => r.id === added.id);
        this.setState({
          ...this.state,
          activeSession: event.activeSession,
          activeRequests:
            added && !alreadyListed
              ? [...this.state.activeRequests, added]
              : this.state.activeRequests,
        });
        break;
      }
      case 'limitReached':
        this.setState({ ...this.state, activeSession: event.activeSession });
        break;
      case 'stopped':
        this.setState({
          ...this.state,
          activeSession: null,
          activeRequests: [],
        });
        break;
    }
  }

  private setState(next: SessionState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }
}

export const sessionStore = new SessionStore();
