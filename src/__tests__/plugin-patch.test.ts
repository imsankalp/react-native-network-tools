/**
 * @jest-environment node
 *
 * Unit tests for applyKotlinPatch and applyJavaPatch.
 * Validates that the interceptor code is inserted correctly and idempotently.
 */

const { applyKotlinPatch, applyJavaPatch } = require('../../plugin/src/index');

const KOTLIN_MAIN_APPLICATION = `package com.example

import com.facebook.react.ReactApplication

class MainApplication : Application(), ReactActivityDelegate {
  override fun onCreate() {
    super.onCreate()
    // existing setup
  }
}
`;

const JAVA_MAIN_APPLICATION = `package com.example;

import com.facebook.react.ReactApplication;

public class MainApplication extends Application implements ReactApplication {
  @Override
  public void onCreate() {
    super.onCreate();
    // existing setup
  }
}
`;

describe('applyKotlinPatch', () => {
  it('inserts the interceptor registration after super.onCreate()', () => {
    const result = applyKotlinPatch(KOTLIN_MAIN_APPLICATION);
    expect(result).not.toBeNull();
    expect(result).toContain('NetworkToolsManager.addInterceptor(builder)');
  });

  it('inserts required Kotlin imports', () => {
    const result = applyKotlinPatch(KOTLIN_MAIN_APPLICATION);
    expect(result).toContain(
      'import com.facebook.react.modules.network.NetworkingModule'
    );
    expect(result).toContain('import com.networktools.NetworkToolsManager');
    expect(result).toContain('import okhttp3.OkHttpClient');
  });

  it('does not duplicate imports when applied twice', () => {
    const once = applyKotlinPatch(KOTLIN_MAIN_APPLICATION)!;
    const twice = applyKotlinPatch(once);
    // idempotent: second application returns the same string
    expect(twice).toBe(once);
  });

  it('does not duplicate the interceptor snippet when applied twice', () => {
    const once = applyKotlinPatch(KOTLIN_MAIN_APPLICATION)!;
    const twice = applyKotlinPatch(once)!;
    const occurrences = (
      twice.match(/NetworkToolsManager\.addInterceptor/g) ?? []
    ).length;
    expect(occurrences).toBe(1);
  });

  it('returns null when onCreate pattern is not found', () => {
    const src = `package com.example\nclass MainApplication : Application() {}`;
    expect(applyKotlinPatch(src)).toBeNull();
  });
});

describe('applyJavaPatch', () => {
  it('inserts the interceptor registration after super.onCreate()', () => {
    const result = applyJavaPatch(JAVA_MAIN_APPLICATION);
    expect(result).not.toBeNull();
    expect(result).toContain('NetworkToolsManager.addInterceptor(builder)');
  });

  it('inserts required Java imports', () => {
    const result = applyJavaPatch(JAVA_MAIN_APPLICATION);
    expect(result).toContain(
      'import com.facebook.react.modules.network.NetworkingModule;'
    );
    expect(result).toContain('import com.networktools.NetworkToolsManager;');
    expect(result).toContain('import okhttp3.OkHttpClient;');
  });

  it('does not duplicate imports when applied twice', () => {
    const once = applyJavaPatch(JAVA_MAIN_APPLICATION)!;
    const twice = applyJavaPatch(once);
    expect(twice).toBe(once);
  });

  it('does not duplicate the interceptor snippet when applied twice', () => {
    const once = applyJavaPatch(JAVA_MAIN_APPLICATION)!;
    const twice = applyJavaPatch(once)!;
    const occurrences = (
      twice.match(/NetworkToolsManager\.addInterceptor/g) ?? []
    ).length;
    expect(occurrences).toBe(1);
  });

  it('returns null when onCreate pattern is not found', () => {
    const src = `package com.example;\npublic class MainApplication extends Application {}`;
    expect(applyJavaPatch(src)).toBeNull();
  });
});
