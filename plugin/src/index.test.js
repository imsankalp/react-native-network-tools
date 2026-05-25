const {
  applyJavaPatch,
  applyKotlinPatch,
  applySwiftAppDelegatePatch,
  applyObjcAppDelegatePatch,
} = require('./index');

// ─── Android ─────────────────────────────────────────────────────────────────

describe('Android MainApplication patch', () => {
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

// ─── iOS ─────────────────────────────────────────────────────────────────────

describe('iOS AppDelegate patch', () => {
  describe('Swift', () => {
    const source = `import UIKit
import React
import React_RCTAppDelegate

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    return true
  }
}
`;

    it('adds the NetworkTools import', () => {
      const patched = applySwiftAppDelegatePatch(source);
      expect(patched).toContain('import NetworkTools');
    });

    it('inserts the #if DEBUG activation block', () => {
      const patched = applySwiftAppDelegatePatch(source);
      expect(patched).toContain('#if DEBUG');
      expect(patched).toContain('NetworkToolsManager.activate()');
      expect(patched).toContain('#endif');
    });

    it('places activate() before the first statement in the function body', () => {
      const patched = applySwiftAppDelegatePatch(source);
      const activateIndex = patched.indexOf('NetworkToolsManager.activate()');
      const delegateIndex = patched.indexOf(
        'let delegate = ReactNativeDelegate()'
      );
      expect(activateIndex).toBeGreaterThanOrEqual(0);
      expect(activateIndex).toBeLessThan(delegateIndex);
    });

    it('is idempotent — applying the patch twice produces the same result', () => {
      const once = applySwiftAppDelegatePatch(source);
      const twice = applySwiftAppDelegatePatch(once);
      expect(twice).toBe(once);
    });

    it('returns null when didFinishLaunchingWithOptions pattern is not found', () => {
      const noDelegate = `import UIKit\nclass AppDelegate: NSObject {}`;
      expect(applySwiftAppDelegatePatch(noDelegate)).toBeNull();
    });
  });

  describe('Objective-C', () => {
    const source = `#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"MyApp";
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end
`;

    it('adds the NetworkToolsManager import', () => {
      const patched = applyObjcAppDelegatePatch(source);
      expect(patched).toContain('#import <NetworkTools/NetworkToolsManager.h>');
    });

    it('inserts the #if DEBUG activation block', () => {
      const patched = applyObjcAppDelegatePatch(source);
      expect(patched).toContain('#if DEBUG');
      expect(patched).toContain('[NetworkToolsManager activate]');
      expect(patched).toContain('#endif');
    });

    it('places [NetworkToolsManager activate] before the first statement', () => {
      const patched = applyObjcAppDelegatePatch(source);
      const activateIndex = patched.indexOf('[NetworkToolsManager activate]');
      const moduleNameIndex = patched.indexOf('self.moduleName');
      expect(activateIndex).toBeGreaterThanOrEqual(0);
      expect(activateIndex).toBeLessThan(moduleNameIndex);
    });

    it('is idempotent — applying the patch twice produces the same result', () => {
      const once = applyObjcAppDelegatePatch(source);
      const twice = applyObjcAppDelegatePatch(once);
      expect(twice).toBe(once);
    });

    it('returns null when didFinishLaunchingWithOptions pattern is not found', () => {
      const noDelegate = `#import "AppDelegate.h"\n@implementation AppDelegate\n@end`;
      expect(applyObjcAppDelegatePatch(noDelegate)).toBeNull();
    });
  });
});
