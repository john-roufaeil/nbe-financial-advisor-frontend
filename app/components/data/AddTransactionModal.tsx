import { forwardRef, useEffect, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { TRANSACTION_CATEGORIES, type Transaction } from "@/lib/demo-transactions";
import { useTransactionsStore } from "@/store/use-transactions-store";

function closeDialog(ref: Ref<HTMLDialogElement>) {
  if (ref && typeof ref === "object" && "current" in ref) ref.current?.close();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export const AddTransactionModal = forwardRef<
  HTMLDialogElement,
  { editing?: Transaction | null }
>(function AddTransactionModal({ editing }, ref) {
  const { t } = useTranslation();
  const addTransaction = useTransactionsStore((s) => s.addTransaction);
  const updateTransaction = useTransactionsStore((s) => s.updateTransaction);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(TRANSACTION_CATEGORIES[0]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);

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
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = Number(amount);
    if (!title.trim() || !amountNum || amountNum <= 0) return;
    if (editing) {
      updateTransaction(editing.id, {
        datetime: `${date}T00:00:00`,
        title: title.trim(),
        category,
        type,
        amount: amountNum,
      });
    } else {
      addTransaction({
        datetime: `${date}T00:00:00`,
        title: title.trim(),
        category,
        type,
        amount: amountNum,
      });
    }
    reset();
    closeDialog(ref);
  }

  return (
    <dialog ref={ref} className="modal">
      <div className="modal-box relative flex flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            reset();
            closeDialog(ref);
          }}
          className="btn btn-ghost btn-sm btn-circle absolute end-2 top-2"
          aria-label={t("actions.close")}
        >
          <X data-no-flip className="size-4" />
        </button>
        <h3 className="text-lg font-semibold">
          {editing ? t("data.addTransaction.editTitle") : t("data.addTransaction.title")}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="label-text text-xs">{t("data.addTransaction.name")}</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered input-sm w-full"
              required
            />
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
            <span className="label-text text-xs">
              {t("data.addTransaction.category")}
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select select-bordered select-sm w-full"
            >
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="label-text text-xs">
                {t("data.addTransaction.amount")}
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered input-sm w-full"
                required
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="label-text text-xs">{t("data.addTransaction.date")}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </label>
          </div>

          <div className="modal-action">
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
            <button type="submit" className="btn btn-primary">
              {editing ? t("actions.done") : t("data.addTransaction.add")}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button className="cursor-default">{t("actions.close")}</button>
      </form>
    </dialog>
  );
});
