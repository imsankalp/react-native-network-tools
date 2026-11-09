const loadNativeModule = (reactNativeMock: Record<string, unknown>) => {
  jest.resetModules();
  jest.doMock('react-native', () => reactNativeMock);
  return require('../NativeNetworkTools');
};

describe('NativeNetworkTools runtime resolution', () => {
  afterEach(() => {
    jest.dontMock('react-native');
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('uses turbo module when available', () => {
    const turbo = {
      getAllRequests: jest.fn(() => '[{"id":"1"}]'),
      getRequestById: jest.fn(() => '{"id":"1"}'),
      clearAllRequests: jest.fn(),
      getRequestCount: jest.fn(() => 1),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    };

    const mod = loadNativeModule({
      NativeModules: {},
      TurboModuleRegistry: {
        get: jest.fn(() => turbo),
      },
    });

    expect(mod.getNetworkToolsRuntime()).toBe('turbo');
    expect(mod.default.getAllRequests()).toBe('[{"id":"1"}]');
  });

  it('falls back to legacy module when turbo is unavailable', () => {
    const legacy = {
      getAllRequests: jest.fn(() => '[{"id":"legacy"}]'),
      getRequestById: jest.fn(() => '{"id":"legacy"}'),
      clearAllRequests: jest.fn(),
      getRequestCount: jest.fn(() => 1),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    };

    const mod = loadNativeModule({
      NativeModules: {
        NetworkToolsLegacy: legacy,
      },
      TurboModuleRegistry: {
        get: jest.fn(() => null),
      },
    });

    expect(mod.getNetworkToolsRuntime()).toBe('legacy');
    expect(mod.default.getAllRequests()).toBe('[{"id":"legacy"}]');
  });

  it('returns safe defaults when native module is unavailable', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const mod = loadNativeModule({
      NativeModules: {},
      TurboModuleRegistry: {
        get: jest.fn(() => null),
      },
    });

    expect(mod.getNetworkToolsRuntime()).toBe('unavailable');
    expect(mod.isNativeNetworkToolsAvailable()).toBe(false);
    expect(mod.default.getAllRequests()).toBe('[]');
    expect(mod.default.getRequestById('id-1')).toBe('{}');
    expect(mod.default.getRequestCount()).toBe(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns safe session defaults when native module is unavailable', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const mod = loadNativeModule({
      NativeModules: {},
      TurboModuleRegistry: {
        get: jest.fn(() => null),
      },
    });
    const native = mod.default;

    expect(() => native.setMaxRequests(10)).not.toThrow();
    expect(native.isCaptureActive()).toBe(false);
    expect(native.startSession()).toBe('');
    expect(native.getActiveSession()).toBe('');
    expect(native.getActiveSessionSummaries()).toBe('[]');
    await expect(native.stopSession()).resolves.toBe('');
    await expect(native.listSessions()).resolves.toBe('[]');
    await expect(native.getSessionSummaries('s')).resolves.toBe('[]');
    await expect(native.getSessionRequest('s', 'r')).resolves.toBe('');
    await expect(native.deleteSession('s')).resolves.toBeUndefined();
    await expect(native.clearSessions()).resolves.toBeUndefined();
  });
});
