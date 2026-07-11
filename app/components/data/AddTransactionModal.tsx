import { forwardRef, useEffect, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { TRANSACTION_CATEGORIES, type Transaction } from "@/types/transaction";
import { useCreateTransaction, useUpdateTransaction } from "@/queries/transactions";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/BaseModal";

function closeDialog(ref: Ref<HTMLDialogElement>) {
  if (ref && typeof ref === "object" && "current" in ref) ref.current?.close();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function minDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d.toISOString().slice(0, 10);
}

export const AddTransactionModal = forwardRef<
  HTMLDialogElement,
  { editing?: Transaction | null }
>(function AddTransactionModal({ editing }, ref) {
  const { t } = useTranslation();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(TRANSACTION_CATEGORIES[0]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setCategory(editing.category);
      setType(editing.type);
      setAmount(String(editing.amount));
      setDate(editing.datetime.slice(0, 10));
    } else {
      reset();
    }
  }, [editing]);

  function reset() {
    setTitle("");
    setCategory(TRANSACTION_CATEGORIES[0]);
    setType("expense");
    setAmount("");
    setDate(today());
    setErrors({});
  }

  const amountNum = Number(amount);
  const isValid =
    title.trim().length > 0 &&
    amount !== "" &&
    Number.isFinite(amountNum) &&
    amountNum > 0;

  function titleError(value: string): string | undefined {
    if (!value.trim()) return undefined;
    if (value.trim().length > 20) return t("data.addTransaction.errors.nameTooLong");
    return undefined;
  }

  function amountError(value: string): string | undefined {
    if (value === "") return undefined;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return t("data.addTransaction.errors.amountInvalid");
    }
    return undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = t("data.addTransaction.errors.nameRequired");
    else if (title.trim().length > 20)
      nextErrors.title = t("data.addTransaction.errors.nameTooLong");
    if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) {
      nextErrors.amount = t("data.addTransaction.errors.amountInvalid");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const patch = {
      datetime: `${date}T00:00:00`,
      title: title.trim(),
      category,
      type,
      amount: amountNum,
    };
    if (editing) {
      updateTransaction.mutate({ id: editing.id, patch });
    } else {
      createTransaction.mutate(patch);
    }
    reset();
    closeDialog(ref);
  }

  const isSaving = createTransaction.isPending || updateTransaction.isPending;

  return (
    <BaseModal
      ref={ref}
      onClose={reset}
      title={
        editing ? t("data.addTransaction.editTitle") : t("data.addTransaction.title")
      }
      actions={
        <>
          <Button
            type="submit"
            form="add-transaction-form"
            loading={isSaving}
            disabled={!isValid}
            className="btn btn-primary"
          >
            {editing ? t("actions.done") : t("data.addTransaction.add")}
          </Button>
          <button
            type="button"
            onClick={() => {
              reset();
              closeDialog(ref);
            }}
            className="btn btn-ghost"
          >
            {t("actions.cancel")}
          </button>
        </>
      }
    >
      <form
        id="add-transaction-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="label-text text-xs">{t("data.addTransaction.name")}</span>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((err) => ({ ...err, title: titleError(e.target.value) }));
            }}
            placeholder={t("data.addTransaction.namePlaceholder")}
            maxLength={20}
            className={`input input-bordered input-sm w-full ${errors.title ? "input-error" : ""}`}
          />
          {errors.title && <span className="text-error text-xs">{errors.title}</span>}
        </label>

        <div className="join border-base-300 w-fit rounded-lg border">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`btn btn-sm join-item cursor-pointer ${type === "expense" ? "btn-error" : "btn-ghost"}`}
          >
            {t("data.filters.expense")}
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`btn btn-sm join-item cursor-pointer ${type === "income" ? "btn-success" : "btn-ghost"}`}
          >
            {t("data.filters.income")}
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="label-text text-xs">{t("data.addTransaction.category")}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select select-bordered select-sm w-full"
          >
            {TRANSACTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`data.categories.${c}`, c)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3">
          <label className="flex flex-col gap-1">
            <span className="label-text text-xs">{t("data.addTransaction.amount")}</span>
            <label
              className={`input input-bordered input-sm flex w-fit items-center gap-2 ${errors.amount ? "input-error" : ""}`}
            >
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((err) => ({ ...err, amount: amountError(e.target.value) }));
                }}
                placeholder={t("data.addTransaction.amountPlaceholder")}
                className="w-24"
              />
              <span className="text-base-content/50 shrink-0 text-xs">
                {t("currency.EGP")}
              </span>
            </label>
            {errors.amount && <span className="text-error text-xs">{errors.amount}</span>}
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="label-text text-xs">{t("data.addTransaction.date")}</span>
            <input
              type="date"
              value={date}
              min={minDate()}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="input input-bordered input-sm w-full"
            />
          </label>
        </div>
      </form>
    </BaseModal>
  );
});
