# Changelog

All notable changes to this project will be documented in this file.

## [0.3.1] - 2026-09-08

### Bug Fixes

- **iOS crash on launch (`setRedactHeaders` unrecognized selector):** `NetworkMonitorProvider` calls `setRedactHeaders` on every mount to push the redact list to native. The method was declared in the JS TurboModule spec but never implemented in `NetworkTools.mm`, causing an ObjC "unrecognized selector" crash at startup. The method is now implemented — it lowercases the header names and stores them on `NetworkToolsManager`. The interceptor applies redaction before storing or emitting each request.
- **Host app touches blocked by floating button (iOS):** The floating button was rendered inside a `Modal`, which creates a separate `UIWindow` on iOS. Even with `pointerEvents="box-none"` on the inner React Native view, the `UIWindow` itself absorbs all touches at the OS `hitTest` level — making the entire host app unclickable. The `Modal` wrapper for the FAB has been removed. `NetworkMonitorProvider` now establishes a positioning context with a `flex: 1` root `View`, and the FAB is rendered as a `StyleSheet.absoluteFillObject` sibling of the app content with `pointerEvents="box-none"`. Touches that miss the button fall through within the same window. The panel continues to use a `Modal` (correct behaviour — the panel should capture all touches when open).

## [0.3.0] - 2026-09-07

### Breaking Changes

- **Removed peer dependencies:** `react-native-gesture-handler`, `react-native-reanimated`, and `react-native-safe-area-context` are no longer required. Remove them from your `package.json` and any setup code (`GestureHandlerRootView`, `SafeAreaProvider`, reanimated babel plugin) that was added solely for this library.
- **`FloatingNetworkMonitor` removed:** The standalone `FloatingNetworkMonitor` component export has been removed. The floating button is now rendered automatically by `NetworkMonitorProvider` — no manual placement needed.

### New Features

- **`triggerMode` prop on `NetworkMonitorProvider`:** Controls how the inspector is opened.
  - `"both"` _(default)_ — floating button + dev menu item (dev builds) / floating button only (production)
  - `"floating"` — floating button only (works in production)
  - `"dev-menu"` — dev menu item only, zero UI on screen
- **Dual-trigger architecture:** The floating button now lives in its own always-present `Modal` so it is never blocked by host app modals or other UI layers.
- **Built-in navigator:** A custom stack + tab navigator replaces React Navigation for the inspector panel — no extra setup required in the host app.
- **Four root tabs:** Requests, WebSocket _(placeholder)_, Sessions _(placeholder)_, Insights _(placeholder)_ — all tappable without crashing.
- **Request detail:** Four-tab detail view — Overview, Request, Response, Timing — with a proportional timing bar, formatted JSON body viewer, and key-value header table.
- **Search / filter:** Real-time case-insensitive filter on URL, method, and status code in the request list.
- **`TriggerMode` type exported** for TypeScript consumers.

### Internal

- UI rebuilt from scratch using only React Native built-ins (`Animated`, `PanResponder`, `Modal`, `SafeAreaView`).
- Floating button rendered as a `StyleSheet.absoluteFillObject` overlay (not a `Modal`) so host-app touches pass through on iOS. The inspector panel uses a `Modal` so it overlays everything when open.
- Design token system extended: `color.ts`, `spacing.ts`, `typography.ts`, `layout.ts`, `animation.ts`.
- Feature module structure under `src/features/` — each tab is self-contained and replaceable.

## [0.2.1] - 2026-02-04

- Add `setRedactHeaders` method to configure headers for redaction.

## [0.2.0] - 2026-01-28

- Initial public release.
