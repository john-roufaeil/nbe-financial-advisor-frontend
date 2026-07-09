import { useBalanceVisibilityStore } from "@/store/use-balance-visibility-store";

/** Wraps any monetary figure so it blurs app-wide when the user toggles balance visibility off. */
export function Money({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const hidden = useBalanceVisibilityStore((s) => s.hidden);
  return (
    <span
      className={`${className} inline-block transition-[filter] duration-200 ${hidden ? "blur-sm select-none" : ""}`}
    >
      {children}
    </span>
  );
}
