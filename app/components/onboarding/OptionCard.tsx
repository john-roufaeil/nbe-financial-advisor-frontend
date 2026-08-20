import type { ReactNode } from "react";
import { Check } from "lucide-react";

export function OptionCard({
  selected,
  onClick,
  title,
  description,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  /** Extra content under the description, e.g. a template's allocation
   * breakdown (ChangeTemplateModal) — omit for the plain title+description
   * card onboarding's TemplateStep uses. */
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`focus-visible:outline-primary/50 flex cursor-pointer items-start gap-2 rounded-md border p-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        selected ? "border-primary bg-primary/10" : "border-base-300 hover:bg-base-200"
      }`}
    >
      <span
        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${
          selected ? "border-primary bg-primary text-primary-content" : "border-base-300"
        }`}
      >
        {selected && <Check data-no-flip className="size-3" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {description && (
          <span className="text-base-content/60 text-xs">{description}</span>
        )}
        {children}
      </span>
    </button>
  );
}
