/**
 * Hidden until focused (first Tab press), then shows jump links so keyboard
 * users can skip repetitive chrome like the sidebar nav.
 * Kept in normal flow (not `fixed`) so revealing it pushes content down
 * instead of overlaying it.
 */
export function SkipLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <div className="focus-within:bg-base-100 focus-within:border-base-300 sr-only focus-within:not-sr-only focus-within:flex focus-within:items-center focus-within:justify-center focus-within:gap-2 focus-within:border-b focus-within:p-3 focus-within:shadow-lg">
      {links.map((link) => (
        <a key={link.href} href={link.href} className="btn btn-primary btn-sm">
          {link.label}
        </a>
      ))}
    </div>
  );
}
