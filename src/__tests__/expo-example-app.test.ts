/**
 * @jest-environment node
 *
 * Tests for the expo-example-app configuration files.
 * Validates that all required fields are present and correct.
 */

import path from 'path';
import fs from 'fs';

const ROOT = path.resolve(__dirname, '../..');
const EXPO_APP = path.join(ROOT, 'example-expo');

describe('expo-example-app configuration', () => {
  // ─── Task 8.1: example-expo/package.json ────────────────────────────────────
  describe('package.json', () => {
    let pkg: Record<string, unknown>;

    beforeAll(() => {
      pkg = JSON.parse(
        fs.readFileSync(path.join(EXPO_APP, 'package.json'), 'utf8')
      );
    });

    it('has the correct package name', () => {
      expect(pkg.name).toBe('react-native-network-tools-example-expo');
    });

    it('includes required scripts', () => {
      const scripts = pkg.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('start');
      expect(scripts).toHaveProperty('android');
      expect(scripts).toHaveProperty('ios');
      expect(scripts).toHaveProperty('prebuild');
    });

    it('declares react-native-network-tools as a dependency', () => {
      const deps = pkg.dependencies as Record<string, string>;
      expect(deps).toHaveProperty('react-native-network-tools');
    });

    it('includes required peer dependencies', () => {
      const deps = pkg.dependencies as Record<string, string>;
      expect(deps).toHaveProperty('react-native-gesture-handler');
      expect(deps).toHaveProperty('react-native-reanimated');
      expect(deps).toHaveProperty('react-native-safe-area-context');
    });
  });

  // ─── Task 8.2: example-expo/app.json ────────────────────────────────────────
  describe('app.json', () => {
    let appJson: { expo: Record<string, unknown> };

    beforeAll(() => {
      appJson = JSON.parse(
        fs.readFileSync(path.join(EXPO_APP, 'app.json'), 'utf8')
      );
    });

    it('references the library plugin', () => {
      const plugins = appJson.expo.plugins as string[];
      expect(plugins).toContain('react-native-network-tools');
    });

    it('targets Expo SDK 53', () => {
      expect(appJson.expo.sdkVersion).toBe('53.0.0');
    });

    it('has android package identifier', () => {
      const android = appJson.expo.android as Record<string, string>;
      expect(android.package).toBe('com.networktools.expoexample');
    });

    it('has iOS bundle identifier', () => {
      const ios = appJson.expo.ios as Record<string, string>;
      expect(ios.bundleIdentifier).toBe('com.networktools.expoexample');
    });
  });

  // ─── Task 8.3: root package.json workspace registration ─────────────────────
  describe('root package.json', () => {
    let rootPkg: Record<string, unknown>;

    beforeAll(() => {
      rootPkg = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
      );
    });

    it('includes example-expo in workspaces', () => {
      const workspaces = rootPkg.workspaces as string[];
      expect(workspaces).toContain('example-expo');
    });

    it('has example:expo passthrough script', () => {
      const scripts = rootPkg.scripts as Record<string, string>;
      expect(scripts).toHaveProperty('example:expo');
    });
  });
});
