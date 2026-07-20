/** Letters (any script, e.g. Latin/Arabic), spaces, hyphens, and apostrophes only — no digits or symbols. */
export const NAME_PATTERN = /^[\p{L}\s'-]+$/u;
