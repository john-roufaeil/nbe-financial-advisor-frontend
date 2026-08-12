import type { ReactNode } from "react";

/**
 * "Stretched button" row: a real button absolutely fills the row so any
 * click on it activates. Nested interactive elements (edit/delete) need
 * `relative z-10`+ on their wrapper or this button swallows their clicks.
 * Avoids ARIA/focus issues a `role="button"` `<li>` would have.
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
