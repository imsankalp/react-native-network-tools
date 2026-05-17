const { applyJavaPatch, applyKotlinPatch } = require('./index');

describe('expo config plugin MainApplication patch', () => {
  it('applies kotlin patch and is idempotent', () => {
    const source = `package networktools.example

import android.app.Application

class MainApplication : Application() {
  override fun onCreate() {
    super.onCreate()
  }
}
`;

    const once = applyKotlinPatch(source);
    expect(once).toContain('NetworkToolsManager.addInterceptor(builder)');

    const twice = applyKotlinPatch(once);
    expect(twice).toBe(once);
  });

  it('applies java patch and is idempotent', () => {
    const source = `package networktools.example;

import android.app.Application;

class MainApplication extends Application {
  @Override
  public void onCreate() {
    super.onCreate();
  }
}
`;

    const once = applyJavaPatch(source);
    expect(once).toContain('NetworkToolsManager.addInterceptor(builder);');

    const twice = applyJavaPatch(once);
    expect(twice).toBe(once);
  });
});
