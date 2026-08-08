/**
 * Visually hidden until the group receives focus (the first Tab press on
 * the page lands here, before the header/sidebar), then reveals as a bar of
 * jump links so a keyboard user can bypass repetitive chrome — a long
 * sidebar nav, a hero image — instead of tabbing through it every visit.
 * Deliberately left in normal document flow rather than `fixed`: as the
 * first child in the layout, reserving its own space here pushes everything
 * below it down instead of overlaying (and hiding) whatever's already at
 * the top of the page.
 * Each target just needs `id` + `tabIndex={-1}` (fragment navigation focuses
 * any element with a tabindex, even -1, so no extra JS is needed here).
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
