import type { ButtonHTMLAttributes } from "react";

/**
 * Standard action button. When `loading` is true it disables itself and swaps
 * its content for a spinner — the app-wide pattern for any button that fires an
 * async mutation, so an in-flight action can't be double-submitted and always
 * shows progress. Pass daisyUI button classes via `className` (e.g. "btn
 * btn-primary"); an icon-only button keeps its size via the same classes.
 */
export function Button({
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button disabled={disabled || loading} className={className} {...props}>
      {loading ? <span className="loading loading-spinner loading-sm" /> : children}
    </button>
  );
}
