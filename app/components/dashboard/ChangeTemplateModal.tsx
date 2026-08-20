import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { useStarterTemplates, useUpdateBudget } from "@/queries/budget";
import { closeDialog } from "@/lib/close-dialog";
import type { StarterTemplate } from "@/types/budget";

/**
 * Lets a signed-in user replace their whole plan's allocations by picking a
 * different starter template — the same GET /budget/starter-templates
 * onboarding reads from (AllowAny, so it works pre- and post-login alike),
 * just surfaced again post-onboarding. Unlike AllocationsEditModal (which
 * tweaks individual percentages), choosing here fully replaces the category
 * set, same "full replacement, not a merge" convention as PATCH /budget's
 * `allocations` field generally.
 */
export const ChangeTemplateModal = forwardRef<
  HTMLDialogElement,
  { currentTemplateKey: string | null }
>(function ChangeTemplateModal({ currentTemplateKey }, ref) {
  const { t } = useTranslation();
  const { data: templates, isPending, isError, refetch } = useStarterTemplates();
  const updateBudget = useUpdateBudget();
  const [selectedKey, setSelectedKey] = useState<string | null>(currentTemplateKey);

  // Re-seed the selection each time the modal's starting point changes (the
  // dialog element persists across opens) — same convention as
  // AllocationsEditModal/CategoryFormModal.
  useEffect(() => {
    setSelectedKey(currentTemplateKey);
  }, [currentTemplateKey]);

  function closeModal() {
    closeDialog(ref);
  }

  function apply() {
    const template = templates?.find((tpl) => tpl.template_key === selectedKey);
    if (!template) return;
    updateBudget.mutate(
      {
        selected_template_key: template.template_key,
        allocations: template.allocations,
        changed_via: "dashboard",
      },
      { onSuccess: () => closeModal() },
    );
  }

  const unchanged = selectedKey === currentTemplateKey;

  return (
    <BaseModal
      ref={ref}
      title={t("dashboard.budget.changeTemplateTitle")}
      actions={
        <>
          <Button
            type="button"
            className="btn btn-primary btn-sm"
            loading={updateBudget.isPending}
            disabled={!selectedKey || unchanged}
            onClick={apply}
          >
            {t("dashboard.budget.applyTemplate")}
          </Button>
          <button type="button" onClick={closeModal} className="btn btn-ghost btn-sm">
            {t("actions.cancel")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-base-content/60 text-sm">
          {t("dashboard.budget.changeTemplateWarning")}
        </p>
        {isPending ? (
          <ListSkeleton rows={3} />
        ) : isError || !templates ? (
          <ErrorState
            message={t("onboarding.template.error")}
            onRetry={() => refetch()}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {templates.map((tpl) => (
              <TemplateOption
                key={tpl.template_key}
                template={tpl}
                selected={selectedKey === tpl.template_key}
                onClick={() => setSelectedKey(tpl.template_key)}
              />
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
});

function TemplateOption({
  template,
  selected,
  onClick,
}: {
  template: StarterTemplate;
  selected: boolean;
  onClick: () => void;
}) {
  // Highest allocation first — a glance at the badges should lead with what
  // the template actually prioritizes, not whatever order the API happens
  // to return. `.slice()` first: `.allocations` is query-cache data, sorting
  // it in place would mutate what other renders/consumers see.
  const sortedAllocations = template.allocations
    .slice()
    .sort((a, b) => b.allocated_percentage - a.allocated_percentage);

  return (
    <OptionCard
      selected={selected}
      onClick={onClick}
      title={template.name}
      description={template.description}
    >
      <div className="mt-1.5 flex flex-wrap gap-1">
        {sortedAllocations.map((a) => (
          <span key={a.category} className="badge badge-ghost badge-sm gap-1">
            <CategoryLabel category={a.category} type="expense" />
            <span className="font-semibold">{a.allocated_percentage}%</span>
          </span>
        ))}
      </div>
    </OptionCard>
  );
}
