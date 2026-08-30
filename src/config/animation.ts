// All animation durations and spring physics constants.
// Centralised here so the overall motion feel can be tuned in one place.

// ── Network panel ─────────────────────────────────────────────────────────────

/** Duration (ms) of the panel sliding up from the bottom on open. */
export const PANEL_SLIDE_DURATION = 220;

// ── Stack navigation ──────────────────────────────────────────────────────────

/** Duration (ms) of a screen sliding in from the right on push. */
export const STACK_PUSH_DURATION = 200;

/** Duration (ms) of a screen sliding out to the right on pop. */
export const STACK_POP_DURATION = 180;

// ── Floating button snap ──────────────────────────────────────────────────────

/**
 * Spring tension for the edge-snap animation after the user releases the button.
 * Higher = snappier return. Matches a light, responsive feel without overshoot.
 */
export const BUTTON_SNAP_TENSION = 68;

/**
 * Spring friction for the edge-snap animation.
 * Higher = less oscillation. Paired with BUTTON_SNAP_TENSION for a single bounce.
 */
export const BUTTON_SNAP_FRICTION = 12;
