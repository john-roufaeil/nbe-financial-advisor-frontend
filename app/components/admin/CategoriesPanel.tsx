import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { Tooltip } from "@/components/shared/Tooltip";
import { useConfirmStore } from "@/store/use-confirm-store";
import { formatDate } from "@/lib/format";
import { AdminPanelShell, ADMIN_PAGE_SIZE } from "@/components/admin/AdminPanelShell";
import {
  useAdminCategories,
  useCreateAdminCategory,
  useUpdateAdminCategory,
  useDeleteAdminCategory,
} from "@/queries/admin";
import type { AdminCategory, AdminCategoryCreateBody } from "@/types/admin";

type TypeFilter = "" | "income" | "expense";

/** Only super_admin can write; the backend answers 403 for reviewers. */
export function CategoriesPanel({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const query = useAdminCategories({
    limit: ADMIN_PAGE_SIZE,
    offset,
    category_type: typeFilter || undefined,
  });
  const deleteMutation = useDeleteAdminCategory();
  const confirm = useConfirmStore((s) => s.confirm);

  function onTypeFilterChange(value: TypeFilter) {
    setTypeFilter(value);
    setOffset(0);
  }

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  function openCreate() {
    setEditing(null);
    dialogRef.current?.showModal();
  }

  function openEdit(category: AdminCategory) {
    setEditing(category);
    dialogRef.current?.showModal();
  }

  function askDelete(category: AdminCategory) {
    confirm({
      title: t("admin.categories.deleteTitle", { name: category.label }),
      message: t("admin.categories.deleteMessage"),
      onConfirm: () => deleteMutation.mutate(category.id),
    });
  }

  return (
    <>
      <AdminPanelShell
        isLoading={query.isLoading}
        isError={query.isError}
        refetch={query.refetch}
        count={query.data?.count ?? 0}
        offset={offset}
        onOffsetChange={setOffset}
        emptyLabel={t("admin.categories.empty")}
        filters={
          <select
            className="select select-bordered select-sm w-auto"
            value={typeFilter}
            aria-label={t("admin.categories.columns.type")}
            onChange={(e) => onTypeFilterChange(e.target.value as TypeFilter)}
          >
            <option value="">{t("admin.categories.filterAll")}</option>
            <option value="expense">{t("admin.categories.types.expense")}</option>
            <option value="income">{t("admin.categories.types.income")}</option>
          </select>
        }
        toolbar={
          canWrite && (
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("admin.categories.add")}
            </button>
          )
        }
      >
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.categories.columns.name")}</th>
              <th>{t("admin.categories.columns.label")}</th>
              <th>{t("admin.categories.columns.type")}</th>
              <th>{t("admin.categories.columns.fallback")}</th>
              <th>{t("admin.columns.createdAt")}</th>
              {canWrite && <th className="text-end">{t("admin.columns.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {query.data?.results.map((category) => (
              <tr key={category.id}>
                <td className="font-mono text-sm">{category.name}</td>
                <td>{category.label}</td>
                <td>
                  <span
                    className={`badge badge-sm shrink-0 whitespace-nowrap ${
                      category.category_type === "income"
                        ? "badge-success badge-outline"
                        : "badge-warning badge-outline"
                    }`}
                  >
                    {t(`admin.categories.types.${category.category_type}`)}
                  </span>
                </td>
                <td>{category.is_fallback ? t("admin.yes") : "—"}</td>
                <td>{formatDate(category.created_at)}</td>
                {canWrite && (
                  <td>
                    <div className="flex justify-end gap-1">
                      <Tooltip content={t("actions.edit")}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle"
                          onClick={() => openEdit(category)}
                          aria-label={t("actions.edit")}
                        >
                          <Pencil data-no-flip className="size-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content={t("actions.delete", { name: category.label })}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          onClick={() => askDelete(category)}
                          aria-label={t("actions.delete", { name: category.label })}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </AdminPanelShell>
      <CategoryFormModal ref={dialogRef} editing={editing} />
    </>
  );
}

interface CategoryFormValues {
  name: string;
  label: string;
  category_type: "income" | "expense";
  is_fallback: boolean;
}

function CategoryFormModal({
  ref,
  editing,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  editing: AdminCategory | null;
}) {
  const { t } = useTranslation();
  const createMutation = useCreateAdminCategory();
  const updateMutation = useUpdateAdminCategory();
  const pending = createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, reset } = useForm<CategoryFormValues>();

  // Re-seed the form each time the target changes (create ⇄ edit, or a
  // different row) — the dialog element persists across opens.
  useEffect(() => {
    reset(
      editing ?? { name: "", label: "", category_type: "expense", is_fallback: false },
    );
  }, [editing, reset]);

  async function onSubmit(values: CategoryFormValues) {
    const body: AdminCategoryCreateBody = values;
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
      } else {
        await createMutation.mutateAsync(body);
      }
      ref.current?.close();
    } catch {
      // Toast already shown; keep the modal open so input isn't lost.
    }
  }

  return (
    <BaseModal
      ref={ref}
      title={editing ? t("admin.categories.editTitle") : t("admin.categories.addTitle")}
      actions={
        <>
          <Button
            type="submit"
            form="admin-category-form"
            className="btn btn-primary"
            loading={pending}
          >
            {t("actions.submit")}
          </Button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => ref.current?.close()}
          >
            {t("actions.cancel")}
          </button>
        </>
      }
    >
      <form
        id="admin-category-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.categories.columns.name")}</span>
          <input
            type="text"
            required
            placeholder="e.g. housing"
            className="input input-bordered w-full font-mono"
            {...register("name")}
          />
          <span className="text-base-content/50 text-xs">
            {t("admin.categories.nameHint")}
          </span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.categories.columns.label")}</span>
          <input
            type="text"
            required
            placeholder="e.g. Housing & Utilities"
            className="input input-bordered w-full"
            {...register("label")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.categories.columns.type")}</span>
          <select
            className="select select-bordered w-full"
            {...register("category_type")}
          >
            <option value="expense">{t("admin.categories.types.expense")}</option>
            <option value="income">{t("admin.categories.types.income")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            {...register("is_fallback")}
          />
          <span className="label-text">{t("admin.categories.fallbackHint")}</span>
        </label>
      </form>
    </BaseModal>
  );
}
