import type {
  ActiveSession,
  SessionChangeEvent,
  SessionIndexEntry,
} from '../context/types';

type Handler = (event: SessionChangeEvent) => void;

const active: ActiveSession = {
  id: 's1',
  name: 'api-recording-2026-11-07T14-32-05',
  status: 'recording',
  startTime: 1000,
  requestCount: 0,
  limitReached: false,
};

const entry = (id: string, startTime: number): SessionIndexEntry => ({
  id,
  name: `api-recording-${id}`,
  status: 'stopped',
  startTime,
  endTime: startTime + 10,
  requestCount: 1,
  limitReached: false,
  sizeBytes: 100,
  schemaVersion: 1,
  platform: 'ios',
  appId: 'com.example',
  appVersion: '1.0',
  libraryVersion: '0.3.0',
});

function makeNative(overrides: Record<string, unknown> = {}) {
  return {
    isCaptureActive: jest.fn(() => true),
    startSession: jest.fn(() => JSON.stringify(active)),
    stopSession: jest.fn(async () => JSON.stringify(entry('s1', 1000))),
    getActiveSession: jest.fn(() => ''),
    getActiveSessionSummaries: jest.fn(() => '[]'),
    listSessions: jest.fn(async () => '[]'),
    getSessionSummaries: jest.fn(async () => '[]'),
    getSessionRequest: jest.fn(async () => ''),
    deleteSession: jest.fn(async () => undefined),
    clearSessions: jest.fn(async () => undefined),
    clearAllRequests: jest.fn(),
    ...overrides,
  };
}

function load(native: ReturnType<typeof makeNative>, available = true) {
  jest.resetModules();
  jest.doMock('../NativeNetworkTools', () => ({
    __esModule: true,
    default: native,
    isNativeNetworkToolsAvailable: () => available,
  }));
  const { sessionStore } = require('../store/SessionStore');
  let handler: Handler | null = null;
  const events = {
    addListener: jest.fn((_name: string, h: Handler) => {
      handler = h;
      return { remove: jest.fn() };
    }),
  };
  return {
    store: sessionStore,
    events,
    emit: (event: SessionChangeEvent) => handler?.(event),
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('SessionStore', () => {
  afterEach(() => {
    jest.dontMock('../NativeNetworkTools');
    jest.resetModules();
  });

  it('reports native-unavailable and refuses to start without the native module', () => {
    const native = makeNative();
    const { store } = load(native, false);
    store.init(null);

    expect(store.getState().availability).toBe('native-unavailable');
    expect(store.start()).toBeNull();
    expect(native.startSession).not.toHaveBeenCalled();
  });

  it('reports capture-inactive and touches no session data when capture is off', async () => {
    const native = makeNative({ isCaptureActive: jest.fn(() => false) });
    const { store, events } = load(native);
    store.init(events);
    await flush();

    expect(store.getState().availability).toBe('capture-inactive');
    expect(store.start()).toBeNull();
    await store.refreshSessions();
    expect(native.startSession).not.toHaveBeenCalled();
    expect(native.listSessions).not.toHaveBeenCalled();
    expect(events.addListener).not.toHaveBeenCalled();
  });

  it('restores an active recording on init (e.g. after a JS reload)', async () => {
    const summary = {
      id: 'r1',
      seq: 1,
      method: 'GET',
      url: 'https://a.test',
      responseCode: 200,
      duration: 5,
      requestTime: 1001,
    };
    const native = makeNative({
      getActiveSession: jest.fn(() =>
        JSON.stringify({ ...active, requestCount: 1 })
      ),
      getActiveSessionSummaries: jest.fn(() => JSON.stringify([summary])),
    });
    const { store, events } = load(native);
    store.init(events);
    await flush();

    expect(store.getState().activeSession).toMatchObject({
      id: 's1',
      requestCount: 1,
    });
    expect(store.getState().activeRequests).toEqual([summary]);
  });

  it('starts a recording and returns null when native refuses a second start', () => {
    const native = makeNative();
    const { store, events } = load(native);
    store.init(events);

    expect(store.start()).toEqual(active);
    native.startSession.mockReturnValue('');
    expect(store.start()).toBeNull();
    expect(store.getState().activeSession).toEqual(active);
  });

  it('applies session change events', () => {
    const { store, events, emit } = load(makeNative());
    store.init(events);
    store.start();

    const added = {
      id: 'r1',
      seq: 1,
      method: 'GET',
      url: 'https://a.test',
      responseCode: 200,
      duration: 5,
      requestTime: 1001,
    };
    emit({
      type: 'request',
      activeSession: { ...active, requestCount: 1 },
      addedRequest: added,
    });
    expect(store.getState().activeRequests).toEqual([added]);
    expect(store.getState().activeSession?.requestCount).toBe(1);

    emit({
      type: 'limitReached',
      activeSession: { ...active, requestCount: 1, limitReached: true },
    });
    expect(store.getState().activeSession?.limitReached).toBe(true);

    emit({ type: 'stopped', activeSession: null });
    expect(store.getState().activeSession).toBeNull();
    expect(store.getState().activeRequests).toEqual([]);
  });

  it('stops, saves and lists sessions newest first', async () => {
    const native = makeNative({
      listSessions: jest.fn(async () =>
        JSON.stringify([entry('old', 1), entry('s1', 1000)])
      ),
    });
    const { store, events } = load(native);
    store.init(events);
    store.start();

    await expect(store.stop()).resolves.toMatchObject({ id: 's1' });
    expect(store.getState().activeSession).toBeNull();
    expect(
      store.getState().sessions.map((s: SessionIndexEntry) => s.id)
    ).toEqual(['s1', 'old']);
  });

  it('deletes one session and clears all, refreshing the list', async () => {
    const native = makeNative();
    const { store, events } = load(native);
    store.init(events);
    await flush();
    native.listSessions.mockClear();

    await store.deleteSession('s1');
    expect(native.deleteSession).toHaveBeenCalledWith('s1');
    await store.clearSessions();
    expect(native.clearSessions).toHaveBeenCalled();
    expect(native.listSessions).toHaveBeenCalledTimes(2);
  });

  it('orders session summaries by seq', async () => {
    const native = makeNative({
      getSessionSummaries: jest.fn(async () =>
        JSON.stringify([
          { id: 'b', seq: 2 },
          { id: 'a', seq: 1 },
        ])
      ),
    });
    const { store, events } = load(native);
    store.init(events);

    const summaries = await store.getSessionSummaries('s1');
    expect(summaries.map((s: { id: string }) => s.id)).toEqual(['a', 'b']);
  });

  it('keeps stored sessions when the global request list is cleared', async () => {
    const native = makeNative({
      listSessions: jest.fn(async () => JSON.stringify([entry('s1', 1000)])),
    });
    const { store, events } = load(native);
    store.init(events);
    await flush();
    const { networkStore } = require('../store/NetworkStore');

    networkStore.clear();
    native.clearAllRequests();
    await store.refreshSessions();
    // let networkStore's animation-frame notification run before teardown
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(native.clearSessions).not.toHaveBeenCalled();
    expect(store.getState().sessions).toHaveLength(1);
  });
});
