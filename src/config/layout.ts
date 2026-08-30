// All fixed dimension and threshold constants used across UI components.
// Import from here — never write magic numbers directly in component files.

// ── Floating button ──────────────────────────────────────────────────────────

/** Width and height of the draggable floating action button. */
export const FLOATING_BUTTON_SIZE = 56;

/** Minimum distance from any screen edge the button can be dragged to. */
export const FLOATING_BUTTON_EDGE_PADDING = 16;

/** Default horizontal position offset from the right edge on first render. */
export const FLOATING_BUTTON_DEFAULT_RIGHT_OFFSET = 20;

/** Default vertical position as a fraction of screen height on first render. */
export const FLOATING_BUTTON_DEFAULT_Y_FRACTION = 0.65;

/**
 * Maximum pointer movement (in logical pixels) that is still classified as a
 * tap rather than a drag. Keeps quick taps from triggering a snap animation.
 */
export const TAP_DISTANCE_THRESHOLD = 6;

// ── Panel chrome ─────────────────────────────────────────────────────────────

/** Height of the top header bar inside the expanded network panel. */
export const PANEL_HEADER_HEIGHT = 52;

/** Height of the root tab bar at the bottom of the network panel. */
export const TAB_BAR_HEIGHT = 48;

/** Height of the per-screen stack header (back arrow + title row). */
export const STACK_HEADER_HEIGHT = 48;

/**
 * Height of the inline tab strip inside RequestDetailScreen
 * (Overview / Request / Response / Timing selector).
 */
export const TAB_STRIP_HEIGHT = 44;

// ── List items ───────────────────────────────────────────────────────────────

/**
 * Fixed height of each row in the request list FlatList.
 * Used by getItemLayout to skip per-item measurement.
 */
export const LIST_ITEM_HEIGHT = 56;

/** Height of the hairline divider rendered between list rows. */
export const LIST_ITEM_DIVIDER_HEIGHT = 1;

// ── Timing tab ───────────────────────────────────────────────────────────────

/**
 * The reference duration (ms) that maps to 100% of the timing bar width.
 * Requests slower than this are capped at full width.
 */
export const TIMING_BAR_MAX_REFERENCE_MS = 3000;

/** Height of the timing bar visual track. */
export const TIMING_BAR_HEIGHT = 6;
