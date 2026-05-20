const { applyJavaPatch, applyKotlinPatch } = require('./index');

describe('expo config plugin MainApplication patch', () => {
  describe('Kotlin', () => {
    const source = `package networktools.example

import android.app.Application

class MainApplication : Application() {
  override fun onCreate() {
    super.onCreate()
  }
}
`;

    it('wraps interceptor setup in a BuildConfig.DEBUG guard', () => {
      const patched = applyKotlinPatch(source);
      expect(patched).toContain('if (BuildConfig.DEBUG)');
      expect(patched).toContain('NetworkToolsManager.addInterceptor(builder)');
    });

    it('places the addInterceptor call inside the DEBUG guard', () => {
      const patched = applyKotlinPatch(source);
      const debugGuardIndex = patched.indexOf('if (BuildConfig.DEBUG)');
      const interceptorIndex = patched.indexOf(
        'NetworkToolsManager.addInterceptor(builder)'
      );
      expect(debugGuardIndex).toBeGreaterThanOrEqual(0);
      expect(interceptorIndex).toBeGreaterThan(debugGuardIndex);
    });

    it('is idempotent — applying the patch twice produces the same result', () => {
      const once = applyKotlinPatch(source);
      const twice = applyKotlinPatch(once);
      expect(twice).toBe(once);
    });

    it('returns null when onCreate pattern is not found', () => {
      const noOnCreate = `package networktools.example\nclass MainApplication : Application()`;
      expect(applyKotlinPatch(noOnCreate)).toBeNull();
    });
  });

  describe('Java', () => {
    const source = `package networktools.example;

import android.app.Application;

class MainApplication extends Application {
  @Override
  public void onCreate() {
    super.onCreate();
  }
}
`;

    it('wraps interceptor setup in a BuildConfig.DEBUG guard', () => {
      const patched = applyJavaPatch(source);
      expect(patched).toContain('if (BuildConfig.DEBUG)');
      expect(patched).toContain('NetworkToolsManager.addInterceptor(builder);');
    });

    it('places the addInterceptor call inside the DEBUG guard', () => {
      const patched = applyJavaPatch(source);
      const debugGuardIndex = patched.indexOf('if (BuildConfig.DEBUG)');
      const interceptorIndex = patched.indexOf(
        'NetworkToolsManager.addInterceptor(builder);'
      );
      expect(debugGuardIndex).toBeGreaterThanOrEqual(0);
      expect(interceptorIndex).toBeGreaterThan(debugGuardIndex);
    });

    it('is idempotent — applying the patch twice produces the same result', () => {
      const once = applyJavaPatch(source);
      const twice = applyJavaPatch(once);
      expect(twice).toBe(once);
    });

    it('returns null when onCreate pattern is not found', () => {
      const noOnCreate = `package networktools.example;\nclass MainApplication extends Application {}`;
      expect(applyJavaPatch(noOnCreate)).toBeNull();
    });
  });
});
