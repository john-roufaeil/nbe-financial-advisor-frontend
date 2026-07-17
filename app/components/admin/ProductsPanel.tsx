import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { Tooltip } from "@/components/shared/Tooltip";
import { useConfirmStore } from "@/store/use-confirm-store";
import { formatDate } from "@/lib/format";
import { AdminPanelShell, ADMIN_PAGE_SIZE } from "@/components/admin/AdminPanelShell";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  useAdminProducts,
  useCreateAdminProduct,
  useUpdateAdminProduct,
  useDeleteAdminProduct,
} from "@/queries/admin";
import type { AdminProduct, AdminProductCreateBody } from "@/types/admin";

type ActiveFilter = "" | "active" | "inactive";

/** Only super_admin can write; the backend answers 403 for reviewers. */
export function ProductsPanel({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const debouncedCategoryFilter = useDebouncedValue(categoryFilter);
  const query = useAdminProducts({
    limit: ADMIN_PAGE_SIZE,
    offset,
    is_active: activeFilter ? activeFilter === "active" : undefined,
    category: debouncedCategoryFilter || undefined,
  });
  const deleteMutation = useDeleteAdminProduct();
  const confirm = useConfirmStore((s) => s.confirm);

  function onActiveFilterChange(value: ActiveFilter) {
    setActiveFilter(value);
    setOffset(0);
  }

  function onCategoryFilterChange(value: string) {
    setCategoryFilter(value);
    setOffset(0);
  }

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<AdminProduct | null>(null);

  function openCreate() {
    setEditing(null);
    dialogRef.current?.showModal();
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    dialogRef.current?.showModal();
  }

  function askDelete(product: AdminProduct) {
    confirm({
      title: t("admin.products.deleteTitle", { name: product.title }),
      message: t("admin.products.deleteMessage"),
      onConfirm: () => deleteMutation.mutate(product.id),
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
        emptyLabel={t("admin.products.empty")}
        filters={
          <>
            <select
              className="select select-bordered select-sm w-auto"
              value={activeFilter}
              aria-label={t("admin.products.columns.active")}
              onChange={(e) => onActiveFilterChange(e.target.value as ActiveFilter)}
            >
              <option value="">{t("admin.products.filterStatus.all")}</option>
              <option value="active">{t("admin.products.filterStatus.active")}</option>
              <option value="inactive">
                {t("admin.products.filterStatus.inactive")}
              </option>
            </select>
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              placeholder={t("admin.products.filterCategory")}
              aria-label={t("admin.products.filterCategory")}
              className="input input-bordered input-sm w-40"
            />
          </>
        }
        toolbar={
          canWrite && (
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("admin.products.add")}
            </button>
          )
        }
      >
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.products.columns.title")}</th>
              <th>{t("admin.products.columns.categories")}</th>
              <th>{t("admin.products.columns.tags")}</th>
              <th>{t("admin.products.columns.active")}</th>
              <th>{t("admin.columns.createdAt")}</th>
              {canWrite && <th className="text-end">{t("admin.columns.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {query.data?.results.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 font-medium">
                      {product.title}
                      {product.external_link && (
                        <a
                          href={product.external_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-base-content/50 hover:text-primary"
                          aria-label={t("admin.products.openLink")}
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </span>
                    {product.description && (
                      <span className="text-base-content/60 line-clamp-2 max-w-md text-xs">
                        {product.description}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex max-w-48 flex-wrap gap-1">
                    {product.categories.map((c) => (
                      <span
                        key={c}
                        className="badge badge-ghost badge-sm shrink-0 whitespace-nowrap"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex max-w-48 flex-wrap gap-1">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="badge badge-outline badge-sm shrink-0 whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span
                    className={`badge badge-sm shrink-0 whitespace-nowrap ${
                      product.is_active ? "badge-success badge-outline" : "badge-ghost"
                    }`}
                  >
                    {product.is_active
                      ? t("admin.products.active")
                      : t("admin.products.inactive")}
                  </span>
                </td>
                <td>{formatDate(product.created_at)}</td>
                {canWrite && (
                  <td>
                    <div className="flex justify-end gap-1">
                      <Tooltip content={t("actions.edit")}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle"
                          onClick={() => openEdit(product)}
                          aria-label={t("actions.edit")}
                        >
                          <Pencil data-no-flip className="size-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content={t("actions.delete", { name: product.title })}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          onClick={() => askDelete(product)}
                          aria-label={t("actions.delete", { name: product.title })}
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
      <ProductFormModal ref={dialogRef} editing={editing} />
    </>
  );
}

/** Comma/newline-separated text fields keep the form simple for array inputs. */
interface ProductFormValues {
  title: string;
  description: string;
  categories: string;
  tags: string;
  external_link: string;
  is_active: boolean;
  problem_statements: string;
}

function toList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ProductFormModal({
  ref,
  editing,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  editing: AdminProduct | null;
}) {
  const { t } = useTranslation();
  const createMutation = useCreateAdminProduct();
  const updateMutation = useUpdateAdminProduct();
  const pending = createMutation.isPending || updateMutation.isPending;

  const { register, handleSubmit, reset } = useForm<ProductFormValues>();

  useEffect(() => {
    reset(
      editing
        ? {
            title: editing.title,
            description: editing.description ?? "",
            categories: editing.categories.join(", "),
            tags: editing.tags.join(", "),
            external_link: editing.external_link ?? "",
            is_active: editing.is_active,
            problem_statements: "",
          }
        : {
            title: "",
            description: "",
            categories: "",
            tags: "",
            external_link: "",
            is_active: true,
            problem_statements: "",
          },
    );
  }, [editing, reset]);

  async function onSubmit(values: ProductFormValues) {
    const body: AdminProductCreateBody = {
      title: values.title,
      description: values.description || undefined,
      categories: toList(values.categories),
      tags: toList(values.tags),
      external_link: values.external_link || undefined,
      is_active: values.is_active,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
      } else {
        // Embedding seed texts are create-time only — the backend has no
        // endpoint to add problem statements to an existing product.
        const statements = toList(values.problem_statements);
        await createMutation.mutateAsync(
          statements.length ? { ...body, problem_statements: statements } : body,
        );
      }
      ref.current?.close();
    } catch {
      // Toast already shown; keep the modal open so input isn't lost.
    }
  }

  return (
    <BaseModal
      ref={ref}
      title={editing ? t("admin.products.editTitle") : t("admin.products.addTitle")}
      actions={
        <>
          <Button
            type="submit"
            form="admin-product-form"
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
        id="admin-product-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.products.columns.title")}</span>
          <input
            type="text"
            required
            className="input input-bordered w-full"
            {...register("title")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.products.columns.description")}</span>
          <textarea
            rows={3}
            className="textarea textarea-bordered w-full"
            {...register("description")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.products.columns.categories")}</span>
          <input
            type="text"
            placeholder={t("admin.products.listHint")}
            className="input input-bordered w-full"
            {...register("categories")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.products.columns.tags")}</span>
          <input
            type="text"
            placeholder={t("admin.products.listHint")}
            className="input input-bordered w-full"
            {...register("tags")}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-text">{t("admin.products.columns.externalLink")}</span>
          <input
            type="url"
            placeholder="https://…"
            className="input input-bordered w-full"
            {...register("external_link")}
          />
        </label>
        {!editing && (
          <label className="flex flex-col gap-1">
            <span className="label-text">{t("admin.products.problemStatements")}</span>
            <textarea
              rows={3}
              placeholder={t("admin.products.problemStatementsHint")}
              className="textarea textarea-bordered w-full"
              {...register("problem_statements")}
            />
          </label>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            {...register("is_active")}
          />
          <span className="label-text">{t("admin.products.activeHint")}</span>
        </label>
      </form>
    </BaseModal>
  );
}
