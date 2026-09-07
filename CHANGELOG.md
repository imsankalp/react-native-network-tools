# Changelog

All notable changes to this project will be documented in this file.

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
- Design token system extended: `color.ts`, `spacing.ts`, `typography.ts`, `layout.ts`, `animation.ts`.
- Feature module structure under `src/features/` — each tab is self-contained and replaceable.

## [0.2.1] - 2026-02-04

- Add `setRedactHeaders` method to configure headers for redaction.

## [0.2.0] - 2026-01-28

- Initial public release.
