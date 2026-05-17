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
});
