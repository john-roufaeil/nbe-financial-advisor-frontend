import type { ReactNode } from "react";

/**
 * A card-style list row with a "stretched button" covering the whole row —
 * a real, sibling `<button>` absolutely positioned to fill the row, sitting
 * ON TOP of the row's non-interactive content (icon/text/amount) so clicks
 * anywhere on them are caught by it. Nested interactive descendants
 * (edit/delete buttons) must be explicitly raised above it via `relative
 * z-10` (or higher) on their wrapper so they keep intercepting their own
 * clicks — per CSS stacking rules, a positioned element with no z-index
 * still paints above plain in-flow content, so the stretched button would
 * otherwise swallow every click on the row, including the action buttons.
 *
 * This avoids the two problems with the previous `role="button"` `<li>`
 * approach: (1) a `role="button"` element must not contain focusable
 * descendants per ARIA authoring practices, and (2) keyboard activation
 * (Enter/Space) on a nested button also bubbled up to the row's own
 * keydown handler, double-firing both actions at once. A real button
 * doesn't have either problem — no nested focusables, and keyboard
 * activation naturally only fires whichever button has focus.
 */
export function ClickableListItem({
  onActivate,
  activateLabel,
  className,
  children,
}: {
  onActivate: () => void;
  activateLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={onActivate}
        aria-label={activateLabel}
        className="focus-visible:outline-primary/50 absolute inset-0 cursor-pointer rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      {children}
    </li>
  );
}
