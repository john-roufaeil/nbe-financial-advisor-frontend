/**
 * Single source of truth for the app's floating-UI stacking order, so new
 * overlays get slotted in deliberately instead of picking an arbitrary
 * z-index that happens to work today. Higher wins; each tier must stay
 * above everything in the tiers before it.
 *
 * Tier order (low to high):
 *  1. DROPDOWN   — inline menus anchored inside normal layout flow
 *     (the app nav drawer, the auth-layout language switcher).
 *  2. POPOVER    — portal-rendered panels positioned via JS (filters, preferences,
 *     EntityPicker's list — portaled so it overlays a modal instead of adding to
 *     the modal's own scroll height).
 *  3. FLOATING_ACTION — persistent screen-edge controls that must sit above popovers
 *     (the accessibility menu's trigger + panel).
 *  4. TOOLTIP    — transient hover/focus hints; must never be occluded by anything.
 */
export const Z_DROPDOWN = "z-20";
export const Z_POPOVER = "z-50";
export const Z_FLOATING_ACTION = "z-60";
export const Z_TOOLTIP = "z-9999";
