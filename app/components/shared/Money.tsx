import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";

/** Wraps any monetary figure so it blurs app-wide when the user toggles balance visibility off. */
export function Money({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const hidden = useDisplayPreferencesStore((s) => s.balanceHidden);
  return (
    <span
      className={`${className} inline-block transition-[filter] duration-200 ${hidden ? "blur-sm select-none" : ""}`}
    >
      {children}
    </span>
  );
}
