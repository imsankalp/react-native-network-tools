# UI Revamp Roadmap: react-native-network-tools

## Overview

**Total Phases:** 6
**Sequencing Rule:** Each phase produces stable, independently testable artifacts before the next begins. No phase assumes anything from a subsequent phase. Forward compatibility is designed at the type-contract level in Phase 0 so every later feature (WebSocket, Sessions, Insights) slots in without structural changes.

---

## Phase 0 — Teardown & Contracts

> **Goal:** Remove all deprecated dependencies, establish the shared type contracts and design tokens that every subsequent phase depends on. Nothing gets built until contracts are frozen.

---

### Task 0.1 — Dependency Removal & Package Cleanup

**Objective:** Strip all three UI libraries from the package without breaking the native data layer.

**Scope:**
- Remove `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context` from `dependencies`, `peerDependencies`, and `devDependencies` in the root `package.json`
- Remove the same from `example/package.json` and `example-expo/package.json`
- Remove any setup code in example apps that bootstraps these libraries (`GestureHandlerRootView` wrapping, reanimated babel plugin, etc.)
- Delete the babel plugin entry for reanimated from `babel.config.js`
- Delete all files under `src/components/` (the entire existing UI layer)
- Delete `src/asset/Close.png` (will be replaced with text)
- Keep `src/asset/NetworkLogo.png` (decision deferred to Task 3.2)

**Acceptance Criteria:**
- `yarn install` completes with no peer dependency warnings related to the three removed packages
- `yarn build` fails (expected — exports reference deleted components), but the failure is only import errors, not native/config errors
- Native module bridge (`NativeNetworkTools.ts`), context, store, hooks, analytics, and util layers are untouched and compile cleanly in isolation
- No reference to `reanimated`, `gesture-handler`, or `safe-area-context` remains in any source file under `src/`

**Status:** [ ] Pending

---

### Task 0.2 — Navigation Type Contracts

**Objective:** Define the complete TypeScript types for the internal navigator so every screen component written in later phases is typed against a stable contract.

**Scope:**
- Create `src/navigation/types.ts`
- Define `Tab` union type: `'requests' | 'websocket' | 'sessions' | 'insights'`
- Define `Screen` discriminated union — all current and anticipated screens with their params:
  - `request-list`
  - `request-detail` (requestId)
  - `websocket-list` ← forward compat placeholder
  - `websocket-detail` (connectionId) ← forward compat placeholder
  - `session-list` ← forward compat placeholder
  - `session-detail` (sessionId) ← forward compat placeholder
  - `session-recording` ← forward compat placeholder
  - `insights-overview` ← forward compat placeholder
  - `insights-performance` ← forward compat placeholder
- Define `NavigatorState`: `{ activeTab: Tab; stacks: Record<Tab, Screen[]> }`
- Define `NavAction` discriminated union: `SWITCH_TAB | PUSH | POP | POP_TO_ROOT`
- Define `NavigatorContextType`: `{ activeTab, currentScreen, canGoBack, stackDepth, push, pop, switchTab, popToRoot }`

**Acceptance Criteria:**
- File compiles independently with zero TypeScript errors
- Adding a new screen in the future requires only appending to the `Screen` union — no other type changes needed
- All types are exported from `src/navigation/types.ts` as named exports
- No runtime code in this file — types only

**Status:** [ ] Pending

---

### Task 0.3 — Design Token Audit & Update

**Objective:** Audit existing `color.ts`, `spacing.ts`, `typography.ts` and extend them to cover all UI patterns needed in the new design without breaking the existing token names.

**Scope:**
- Audit `src/config/color.ts` — add missing semantic tokens: `border`, `divider`, `tabBarBackground`, `tabBarActiveIndicator`, `overlayDim`, `inputBackground`, `placeholderText`
- Audit `src/config/spacing.ts` — add `none: 0`, `hairline: StyleSheet.hairlineWidth`
- Audit `src/config/typography.ts` — add `label` (12px, medium), `mono` (13px, monospace), `overline` (11px, uppercase)
- Create `src/config/layout.ts` — constants: `FLOATING_BUTTON_SIZE`, `FLOATING_BUTTON_EDGE_PADDING`, `TAP_DISTANCE_THRESHOLD`, `PANEL_HEADER_HEIGHT`, `TAB_BAR_HEIGHT`, `STACK_HEADER_HEIGHT`, `LIST_ITEM_HEIGHT`, `TAB_STRIP_HEIGHT`
- Create `src/config/animation.ts` — constants: `PANEL_SLIDE_DURATION`, `STACK_PUSH_DURATION`, `STACK_POP_DURATION`, `BUTTON_SNAP_TENSION`, `BUTTON_SNAP_FRICTION`

**Acceptance Criteria:**
- All existing token names remain unchanged (no renames, no deletions)
- All new tokens have an inline comment explaining their intended use case
- `layout.ts` and `animation.ts` compile cleanly and export all constants as named exports
- No magic numbers appear anywhere in Phase 1+ components — every constant is imported from config

**Status:** [ ] Pending

---

## Phase 1 — Navigation Infrastructure

> **Goal:** Build the custom stack+tab navigator — the backbone that all feature screens mount onto. This phase produces no visible UI on its own; it is pure logic and context.

---

### Task 1.1 — Navigator Reducer

**Objective:** Implement the pure state-management reducer for the navigator.

**Scope:**
- Create `src/navigation/reducer.ts`
- Implement `navigatorReducer(state: NavigatorState, action: NavAction): NavigatorState`
- Handle all four action types: `SWITCH_TAB`, `PUSH`, `POP`, `POP_TO_ROOT`
- `POP` is a no-op when stack depth is 1 — do not throw
- `PUSH` appends to the active tab's stack
- `SWITCH_TAB` only changes `activeTab` — each tab's stack is preserved independently
- Define and export `INITIAL_STATE`: all four tabs initialized with their root screen, `activeTab: 'requests'`
- Define and export `createInitialState()` factory for testability

**Acceptance Criteria:**
- Reducer is a pure function — no side effects, no imports from React
- All action types covered with no fallthrough
- `SWITCH_TAB` to the same active tab is idempotent
- `POP` on a single-item stack returns the same state reference (no unnecessary re-render)
- Unit tests cover all action types including edge cases (double pop, push then pop returns root)

**Status:** [ ] Pending

---

### Task 1.2 — Navigator Context & Hook

**Objective:** Provide the navigator state and dispatch actions to any descendant component via a React context hook.

**Scope:**
- Create `src/navigation/NavigatorContext.tsx`
- Create context with `NavigatorContextType` (from Task 0.2)
- Implement `NavigatorProvider` component: wraps `useReducer(navigatorReducer, INITIAL_STATE)` and derives `currentScreen`, `canGoBack`, `stackDepth` from state before providing via context
- Export `useNavigator()` hook — throws a descriptive error if used outside provider
- `push`, `pop`, `switchTab`, `popToRoot` are memoized with `useCallback` so context consumers don't re-render spuriously

**Acceptance Criteria:**
- `useNavigator()` outside provider throws: `"useNavigator must be called within NavigatorProvider"`
- `push` and `pop` trigger exactly one re-render in consumers
- `canGoBack` is `true` only when current tab's stack depth > 1
- `currentScreen` always equals `stacks[activeTab][stacks[activeTab].length - 1]`

**Status:** [ ] Pending

---

### Task 1.3 — Screen Renderer

**Objective:** Centralize the mapping from `Screen` discriminated union to React components. This is the only file modified when a new screen is added.

**Scope:**
- Create `src/navigation/ScreenRenderer.tsx`
- Define `SCREEN_REGISTRY`: a record mapping every `Screen['name']` to a React component type
- For screens whose feature modules don't exist yet, register a `PlaceholderScreen` component that renders the tab name and "Coming soon"
- `ScreenRenderer` extracts the active screen from `NavigatorContext` and renders the mapped component, passing the full `Screen` object as a `screen` prop
- The TypeScript mapping must be exhaustive — adding a new entry to `Screen` union without registering it here produces a compile error

**Acceptance Criteria:**
- TypeScript reports an error if any `Screen['name']` is missing from `SCREEN_REGISTRY`
- `PlaceholderScreen` renders without crashing for all unimplemented tabs
- `ScreenRenderer` does not accept any props — reads exclusively from `NavigatorContext`
- No conditional rendering logic lives here — only the registry lookup and render call

**Status:** [ ] Pending

---

### Task 1.4 — Navigator Component (Orchestrator)

**Objective:** Compose the reducer, context, and screen renderer into the `Navigator` component that manages the push/pop slide animation.

**Scope:**
- Create `src/navigation/Navigator.tsx`
- Wraps `NavigatorProvider` around the screen content
- Maintains a single `Animated.Value` for horizontal slide animation (`translateX`)
- On `push`: set `slideAnim` to `+screenWidth`, dispatch `PUSH`, then animate to `0`
- On `pop`: animate `slideAnim` from `0` to `+screenWidth`, then dispatch `POP` in the animation completion callback, then reset `slideAnim` to `0`
- On `switchTab`: no animation — immediate render
- Uses `useNativeDriver: true` on all animations (transform only)
- `StackHeader` is rendered above the animated `ScreenRenderer` (header does not slide — only content slides)
- Exposes `navigatorRef` (forwarded ref) for imperative access if needed in the future

**Acceptance Criteria:**
- Push animation: screen slides in from right in `STACK_PUSH_DURATION`ms
- Pop animation: screen slides out to right in `STACK_POP_DURATION`ms, old screen appears behind
- Switching tabs: no animation, instant render
- Rapid push/pop does not break UI position (animation is cancelled and re-started cleanly)
- `useNativeDriver: true` confirmed in all `Animated` calls

**Status:** [ ] Pending

---

## Phase 2 — Shared UI Primitives

> **Goal:** Build the reusable, stateless UI components used across all feature screens. Each primitive is independently renderable and testable. No feature logic or navigation logic lives here.

---

### Task 2.1 — StackHeader

**Objective:** Shared header bar rendered by the Navigator above every screen — back arrow (when applicable), title, and optional right-side action slot.

**Scope:**
- Create `src/components/StackHeader.tsx`
- Props: `title: string`, `rightAction?: React.ReactNode`, `onBack?: () => void`
- Reads `canGoBack` from `NavigatorContext` to determine if back arrow renders
- Back arrow is a `TouchableOpacity` with a `<` text character — no image asset
- Title is centered with `numberOfLines={1}` and `ellipsizeMode="tail"`
- `rightAction` slot renders right-aligned — used for Clear button, Record button, etc.
- Fixed height matches `STACK_HEADER_HEIGHT` from layout config

**Acceptance Criteria:**
- Back arrow visible only when `canGoBack === true`
- `onBack` called exactly once per tap — no double-firing on rapid taps
- `rightAction` renders without affecting title centering
- `title` truncates correctly on narrow screens
- No hardcoded colors, spacing, or font sizes — all from config tokens

**Status:** [ ] Pending

---

### Task 2.2 — RootTabBar

**Objective:** The top-level tab bar allowing switching between Requests, WebSocket, Sessions, and Insights.

**Scope:**
- Create `src/components/TabBar.tsx`
- Props: `tabs: Array<{ key: Tab; label: string }>` — no hardcoded tab list
- Reads `activeTab` from `NavigatorContext` and calls `switchTab` on press
- Active indicator: a 2px bottom border on the active tab label — no sliding animation
- Each tab label uses `typography.label` token
- Tapping the already-active tab calls `popToRoot` on that tab's stack
- Fixed height matches `TAB_BAR_HEIGHT` from layout config

**Acceptance Criteria:**
- Tapping inactive tab: switches tab with no animation
- Tapping active tab at root: no-op (already at root)
- Tapping active tab with stack depth > 1: pops to root
- All four tabs accessible without horizontal scroll
- Active tab indicator renders without layout shift on tab change

**Status:** [ ] Pending

---

### Task 2.3 — Badge

**Objective:** Colored pill/chip component for HTTP method labels and status codes.

**Scope:**
- Create `src/components/Badge.tsx`
- Props: `label: string`, `color: string`, `textColor?: string` (defaults to white), `size?: 'sm' | 'md'`
- Uses existing `httpMethodConfig` for method colors — does not re-define them
- Renders a `View` with `borderRadius`, background `color`, and centered `Text`
- No shadow, no border — solid background only

**Acceptance Criteria:**
- Renders correctly for all HTTP methods defined in `httpMethodConfig`
- Renders correctly for status codes (200, 201, 301, 400, 401, 403, 404, 500)
- `size="sm"` is visibly smaller than `size="md"` but both remain legible
- No `Platform`-specific styles

**Status:** [ ] Pending

---

### Task 2.4 — KeyValueTable

**Objective:** Renders a list of key-value pairs (HTTP headers, metadata fields) in a consistent, readable format.

**Scope:**
- Create `src/components/KeyValueTable.tsx`
- Props: `data: Record<string, string> | Array<{ key: string; value: string }>`, `emptyMessage?: string`
- Renders as a plain `View` with rows — not a `FlatList`
- Keys rendered with `typography.mono` in a muted color, values in default body color
- Long values wrap with `flexWrap` — do not truncate header values
- Horizontal divider between rows using `StyleSheet.hairlineWidth`
- Empty state renders `emptyMessage` or a default "No headers"

**Acceptance Criteria:**
- Accepts both object and array input shapes
- Long header values wrap without overflowing
- Keys and values are visually distinguishable without color alone (weight difference)
- Renders correctly with 0, 1, and 50+ items

**Status:** [ ] Pending

---

### Task 2.5 — JsonViewer

**Objective:** Display JSON body content in a formatted, readable way without a third-party syntax highlighter.

**Scope:**
- Create `src/components/JsonViewer.tsx`
- Props: `raw: string | undefined | null`, `emptyMessage?: string`
- Attempts `JSON.parse(raw)` — if successful, renders `JSON.stringify(parsed, null, 2)` in monospace `Text` wrapped in `ScrollView`
- If parse fails, renders raw string as-is with a subtle "Raw" label
- If `raw` is null/undefined/empty, renders `emptyMessage`
- Background uses `colors.surfaceBg`, font uses `typography.mono`
- No interactive expand/collapse nodes — flat formatted string only

**Acceptance Criteria:**
- Valid JSON is always pretty-printed with 2-space indentation
- Invalid JSON displays raw content without throwing
- Horizontal scrolling enabled for wide JSON lines
- Component renders correctly when `raw` changes between renders
- Try/catch around `JSON.parse` — component never crashes on malformed input

**Status:** [ ] Pending

---

### Task 2.6 — EmptyState

**Objective:** Consistent empty state display used across all list screens.

**Scope:**
- Create `src/components/EmptyState.tsx`
- Props: `title: string`, `subtitle?: string`, `action?: { label: string; onPress: () => void }`
- Centered layout, icon area is a styled `View` shape — no image assets

**Acceptance Criteria:**
- Renders in the center of its parent container (parent must be `flex: 1`)
- Optional subtitle and action button render correctly when provided and absent when not
- No images, no platform-specific code

**Status:** [ ] Pending

---

### Task 2.7 — SearchBar

**Objective:** Text input for filtering request lists and session lists.

**Scope:**
- Create `src/components/SearchBar.tsx`
- Props: `value: string`, `onChangeText: (text: string) => void`, `placeholder?: string`, `onClear?: () => void`
- Plain `TextInput` from `react-native` wrapped in a styled container
- Clear button (×) appears when `value.length > 0`
- `autoCapitalize="none"`, `autoCorrect={false}`, `returnKeyType="search"`, `clearButtonMode="never"`

**Acceptance Criteria:**
- Clear button only visible when input is non-empty
- Tapping clear resets input and fires `onClear` if provided
- `autoCapitalize` and `autoCorrect` disabled — critical for URL/header search
- No platform-specific behavior differences between iOS and Android

**Status:** [ ] Pending

---

## Phase 3 — Shell Architecture

> **Goal:** Build the two-Modal shell structure (FloatingButton + NetworkPanel) and wire them to the NetworkMonitorContext. After this phase, the full inspector is functional end-to-end with placeholder screens.

---

### Task 3.1 — NetworkMonitorShell

**Objective:** The root UI coordinator — owns `isExpanded` state and renders the two Modals.

**Scope:**
- Create `src/components/network-monitor-shell/index.tsx`
- Reads `showFloatingMonitor` from `NetworkMonitorContext`
- Owns `isExpanded: boolean` state
- Renders **Modal A** (FAB Modal): `visible={showFloatingMonitor}`, `transparent`, `animationType="none"`, `statusBarTranslucent`, wrapper `View` with `pointerEvents="box-none"`
- Renders **Modal B** (Panel Modal): `visible={isExpanded}`, `transparent`, `animationType="none"`, `statusBarTranslucent`, `onRequestClose={() => setIsExpanded(false)}`
- Effect: `if (!showFloatingMonitor && isExpanded) setIsExpanded(false)`

**Acceptance Criteria:**
- Modal A is always mounted while `showFloatingMonitor` is true, even when `isExpanded` is true
- Modal B is mounted/unmounted on each open/close — ensures fresh state per session
- Android back button (via `onRequestClose`) closes the panel
- Toggling `showFloatingMonitor` to false while panel is open closes the panel gracefully
- Zero UI is rendered when `showFloatingMonitor` is false

**Status:** [ ] Pending

---

### Task 3.2 — FloatingButton

**Objective:** The draggable floating action button using `PanResponder` and `Animated.ValueXY`.

**Scope:**
- Create `src/components/floating-button/index.tsx`
- Props: `onPress: () => void`
- `Animated.ValueXY` initialized to default position (bottom-right)
- `PanResponder` configured with grant/move/release/terminate handlers
- `snapToEdge()`: snaps X to nearest edge, clamps Y within safe bounds, uses `Animated.spring`
- Safe top = `Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44`
- Safe bottom = `Platform.OS === 'ios' ? 34 : 0`
- Tap vs drag discrimination: `Math.sqrt(dx² + dy²) < TAP_DISTANCE_THRESHOLD`

**Acceptance Criteria:**
- Dragging by more than `TAP_DISTANCE_THRESHOLD` pixels does not trigger `onPress`
- Tapping (drag distance below threshold) always triggers `onPress`
- After drag release, button always snaps to left or right edge — never floats in the middle
- Button never goes above safe top or below safe bottom
- `onPanResponderTerminate` prevents stuck-dragging after system interrupt
- Button position is preserved in `useRef` — survives parent re-renders

**Status:** [ ] Pending

---

### Task 3.3 — NetworkPanel

**Objective:** The full-screen container shown in Modal B — hosts the Navigator, handles the entry animation.

**Scope:**
- Create `src/components/network-panel/index.tsx`
- Props: `onClose: () => void`
- Full-screen dark background wrapped in `SafeAreaView` from `react-native`
- Entry animation: `translateY` from `+screenHeight` to `0` on mount using `Animated.timing` with `useNativeDriver: true`
- Layout: `SafeAreaView > View (flex:1) > RootTabBar (bottom) + Navigator (flex:1 above TabBar)`
- `onClose` passed to `StackHeader` as the `×` button action and to Android back via Shell's `onRequestClose`

**Acceptance Criteria:**
- Entry animation plays on every open — no stale animation state (component unmounts between sessions)
- `SafeAreaView` prevents content from going under notch on iOS or status bar on Android
- `RootTabBar` is always visible at the bottom — content above scrolls independently
- Panel fills the entire screen with no gaps or overflow on any device size

**Status:** [ ] Pending

---

### Task 3.4 — Provider Integration

**Objective:** Wire `NetworkMonitorShell` into `NetworkMonitorProvider` and remove all references to old components.

**Scope:**
- Update `src/context/NetworkMonitorContext.tsx`: replace existing `FloatingNetworkMonitor` render with `NetworkMonitorShell`
- Update `src/index.tsx`: remove exports of deleted components; keep all data-layer and hook exports unchanged
- Verify `NetworkMonitorProvider` public API (props interface) is unchanged

**Acceptance Criteria:**
- `yarn build` completes with zero TypeScript errors
- All existing public exports in `src/index.tsx` that are part of the documented API still resolve
- Wrapping any app with `NetworkMonitorProvider` renders the floating button without any additional setup
- `showFloatingMonitor={false}` prop renders nothing — zero UI footprint

**Status:** [ ] Pending

---

## Phase 4 — Network Requests Feature

> **Goal:** Build the fully functional Requests tab screens (List + Detail). This is the core feature that must reach feature-parity with the old UI before any new features are added.

---

### Task 4.1 — RequestListItem

**Objective:** The memoized row component for the request list.

**Scope:**
- Create `src/features/network-requests/components/RequestListItem.tsx`
- Props: `request: NetworkRequest`, `onPress: () => void`
- Wrapped in `React.memo` with custom comparator: re-render only when `id` or `responseCode` changes
- Layout (fixed height matching `LIST_ITEM_HEIGHT`):
  - Left: `Badge` for HTTP method
  - Center-left: status code colored by success/error threshold
  - Center: URL path with `numberOfLines={1}`, `ellipsizeMode="middle"`
  - Right: `formatDuration` + `formatDate` stacked
- Pending state (no `responseCode` yet): status shows `···` in muted color
- Error state (`responseCode >= 400`): row left border accent in `colors.error`

**Acceptance Criteria:**
- Component re-renders ONLY when `responseCode` or `id` changes
- Fixed height enables `getItemLayout` on parent `FlatList`
- Pending requests update to show status code when response arrives
- Tapping anywhere on the row triggers `onPress` once

**Status:** [ ] Pending

---

### Task 4.2 — RequestListScreen

**Objective:** The root screen of the Requests tab — FlatList of all captured requests with search/filter.

**Scope:**
- Create `src/features/network-requests/screens/RequestListScreen.tsx`
- Reads `requests` from `NetworkMonitorContext`
- Local state: `searchQuery: string`
- Filtered list: `useMemo(() => filterByQuery(requests, searchQuery), [requests, searchQuery])`
- `filterByQuery`: case-insensitive match against URL, method, and status code string
- `FlatList` config: `keyExtractor`, `getItemLayout`, `initialNumToRender={20}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, `removeClippedSubviews={true}`
- On item press: `useNavigator().push({ name: 'request-detail', requestId: item.id })`
- Empty state (no requests): "No Requests" with subtitle
- Empty state (search no results): `No results for "${searchQuery}"`

**Acceptance Criteria:**
- List scrolls smoothly with 500+ items — no dropped frames
- `getItemLayout` is provided — list does not measure items individually
- New requests prepend to the top — list does not scroll to top automatically on update
- Clearing search immediately restores full list

**Status:** [ ] Pending

---

### Task 4.3 — Detail Tab: OverviewTab

**Objective:** Shows the summary fields of a single network request.

**Scope:**
- Create `src/features/network-requests/screens/detail-tabs/OverviewTab.tsx`
- Props: `request: NetworkRequest`
- Displays in a `ScrollView`: Full URL (selectable), Method (Badge), Status code, Duration, Request timestamp
- Custom error section visible only if `request.customError` is set

**Acceptance Criteria:**
- Custom error section renders only when `request.customError` is non-null
- Full URL is selectable (user can copy it)
- All fields render correctly for pending requests (null `responseCode`, null `duration`)
- No overflow or layout break on very long URLs

**Status:** [ ] Pending

---

### Task 4.4 — Detail Tab: RequestTab

**Objective:** Shows outgoing request headers and body.

**Scope:**
- Create `src/features/network-requests/screens/detail-tabs/RequestTab.tsx`
- Props: `request: NetworkRequest`
- Two labeled sections in a `ScrollView`: "Headers" (`KeyValueTable`) + "Body" (`JsonViewer`)

**Acceptance Criteria:**
- Empty headers: `KeyValueTable` shows "No headers"
- Empty body: `JsonViewer` shows "No request body"
- Redacted headers render without crashing
- Sections are clearly visually separated

**Status:** [ ] Pending

---

### Task 4.5 — Detail Tab: ResponseTab

**Objective:** Shows incoming response headers, body, and any error details.

**Scope:**
- Create `src/features/network-requests/screens/detail-tabs/ResponseTab.tsx`
- Props: `request: NetworkRequest`
- Three labeled sections in a `ScrollView`: "Headers", "Body", "Error Details" (conditional)

**Acceptance Criteria:**
- Same empty state behavior as Task 4.4
- Error Details section conditionally visible
- Renders correctly for pending responses

**Status:** [ ] Pending

---

### Task 4.6 — Detail Tab: TimingTab

**Objective:** Shows timing breakdown for the request lifecycle.

**Scope:**
- Create `src/features/network-requests/screens/detail-tabs/TimingTab.tsx`
- Props: `request: NetworkRequest`
- Displays: Started At, Completed At, Total Duration
- Visual timing bar: proportional width `View` — color-coded: green (<500ms), yellow (500–1500ms), red (>1500ms)
- `MAX_REFERENCE_MS = 3000` from layout config
- No animation on the bar — static width derived from data

**Acceptance Criteria:**
- Bar width never exceeds container width (clamped to 100%)
- Pending requests show all timing fields as `—` placeholder
- Bar color threshold logic is covered by unit tests

**Status:** [ ] Pending

---

### Task 4.7 — RequestDetailScreen

**Objective:** The pushed screen that composes the four detail tabs with a tab strip navigator.

**Scope:**
- Create `src/features/network-requests/screens/RequestDetailScreen.tsx`
- Receives `screen: Extract<Screen, { name: 'request-detail' }>` — extracts `requestId`
- Reads request from `NetworkMonitorContext` by ID
- Local state: `activeTab: 'overview' | 'request' | 'response' | 'timing'`
- Tab content: conditional rendering — only the active tab is in the tree
- If request not found: render `EmptyState` with "Request no longer available"

**Acceptance Criteria:**
- Switching tabs is instant — no animation between tabs
- Each tab's scroll position resets when tab is changed (conditional rendering handles this)
- "Not found" state renders gracefully — no crash
- `StackHeader` title shows the endpoint path, not full URL

**Status:** [ ] Pending

---

## Phase 5 — Polish, Forward-Compat Scaffolding & Cleanup

> **Goal:** Final integration, QA on both example apps, and scaffolding of placeholder screens for upcoming features so the tab bar is coherent immediately.

---

### Task 5.1 — Placeholder Screens for Future Tabs

**Objective:** Register meaningful placeholder screens for WebSocket, Sessions, and Insights tabs.

**Scope:**
- Create `src/features/websocket/screens/WebSocketListScreen.tsx` — `EmptyState` "WebSocket Inspector / Coming in a future release"
- Create `src/features/sessions/screens/SessionListScreen.tsx` — `EmptyState` "Session Recording / Coming in a future release"
- Create `src/features/insights/screens/InsightsOverviewScreen.tsx` — `EmptyState` "Insights / Coming in a future release"
- Register all placeholder screens in `ScreenRenderer`

**Acceptance Criteria:**
- All four tabs are tappable and render without crashing
- Placeholder screens are clearly marked "coming soon" — not blank white screens
- Placeholder screens are the exact files that will be replaced in-place when those features are built

**Status:** [ ] Pending

---

### Task 5.2 — Example App Validation (Bare RN)

**Objective:** Validate the full revamped UI in the bare React Native example app.

**Scope:**
- Remove `GestureHandlerRootView`, reanimated plugin, and safe area provider setup from `example/`
- Manual validation checklist:
  - Floating button appears at startup
  - Drag to reposition — snaps to edges
  - Tap opens the panel (Modal B above any existing UI)
  - Request list populates in real time
  - Tapping a request opens detail
  - All four detail tabs render correctly
  - Back button returns to list
  - Clear button empties the list
  - Close button dismisses panel
  - All four root tabs are tappable
  - Android back button closes panel
  - App UI is not blocked when panel is closed

**Acceptance Criteria:**
- All checklist items pass on both iOS and Android
- No RN warnings in Metro output related to this library
- No crashes in any user flow

**Status:** [ ] Pending

---

### Task 5.3 — Example App Validation (Expo)

**Objective:** Validate the full revamped UI in the Expo example app.

**Scope:**
- Remove library-specific setup for the three removed dependencies from `example-expo/`
- Run the same manual validation checklist as Task 5.2
- Additional Expo-specific checks:
  - Config plugin still applies correctly
  - `npx expo prebuild` completes without errors
  - No Expo SDK version constraints introduced

**Acceptance Criteria:**
- All Task 5.2 checklist items pass on Expo build
- `npx expo prebuild` completes without errors
- No native module warnings related to removed dependencies

**Status:** [ ] Pending

---

### Task 5.4 — Package.json & Documentation Update

**Objective:** Finalize the package manifest and update user-facing documentation to reflect removed peer dependencies.

**Scope:**
- Confirm `peerDependencies` contains only `react` and `react-native`
- Update `README.md`: remove installation steps and setup sections for the three removed libraries
- Update `ARCHITECTURE.md`: update the component breakdown section to reflect Navigator + feature module structure
- Bump minor version (`0.2.x → 0.3.0`) — breaking change in peer deps
- `CHANGELOG.md` entry documents removed dependencies

**Acceptance Criteria:**
- `README.md` installation section references only `react` and `react-native` as peer deps
- No mention of removed libraries in any docs
- Version bump follows semver
- `CHANGELOG.md` entry exists and is accurate

**Status:** [ ] Pending

---

## Dependency Graph (Task Sequencing)

```
0.1 → 0.2 → 0.3
             │
             ├──→ 1.1 → 1.2 → 1.3 → 1.4
             │                        │
             ├──→ 2.1                 │
             ├──→ 2.2 ────────────────┤
             ├──→ 2.3                 │
             ├──→ 2.4                 │
             ├──→ 2.5                 │
             ├──→ 2.6                 │
             └──→ 2.7                 │
                                      ▼
                             3.1 → 3.2, 3.3 → 3.4
                                              │
                                              ▼
                                  4.1 → 4.2
                                  4.3 ┐
                                  4.4 ├─→ 4.7
                                  4.5 │
                                  4.6 ┘
                                              │
                                              ▼
                                  5.1 → 5.2 → 5.3 → 5.4
```

**Parallelism opportunities:**
- All of Phase 2 (2.1–2.7) can be built in parallel once Phase 0 is done
- Phase 1 and Phase 2 can run in parallel
- Tasks 4.3–4.6 (detail tabs) are independent of each other and can run in parallel
- Tasks 5.2 and 5.3 can run in parallel
