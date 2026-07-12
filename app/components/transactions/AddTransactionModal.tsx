import { forwardRef, useEffect, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { TRANSACTION_CATEGORIES, type Transaction } from "@/types/transaction";
import { useCreateTransaction, useUpdateTransaction } from "@/queries/transactions";
import { useAccounts } from "@/queries/accounts";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/BaseModal";
import { AddBankAccountModal } from "@/components/accounts/AddBankAccountModal";
import { AccountPicker } from "@/components/transactions/AccountPicker";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { MAX_MONEY_VALUE } from "@/lib/format";

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
  const { data: accounts } = useAccounts();
  const accountModalRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState<string>(TRANSACTION_CATEGORIES[0]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(today);
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    accountId?: string;
  }>({});
  const [awaitingNewAccount, setAwaitingNewAccount] = useState(false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setAccountId(editing.accountId ?? "");
      setCategory(editing.category);
      setType(editing.type);
      setAmount(editing.amount);
      setDate(editing.datetime.slice(0, 10));
    } else {
      reset();
    }
  }, [editing]);

  // Default to the user's first active account once accounts load, and
  // auto-select the account just created via the "add new account" flow.
  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    if (editing) return;
    if (awaitingNewAccount) {
      const newest = [...accounts].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      )[0];
      setAccountId(newest.id);
      setAwaitingNewAccount(false);
      return;
    }
    if (!accountId) {
      const account = accounts.find((a) => a.is_active) ?? accounts[0];
      setAccountId(account.id);
    }
  }, [accounts, editing, awaitingNewAccount, accountId]);

  function reset() {
    setTitle("");
    setAccountId("");
    setCategory(TRANSACTION_CATEGORIES[0]);
    setType("expense");
    setAmount("");
    setDate(today());
    setErrors({});
  }

  function handleAccountChange(value: string) {
    setAccountId(value);
    setErrors((err) => ({ ...err, accountId: undefined }));
  }

  function handleAddNewAccount() {
    setAwaitingNewAccount(true);
    accountModalRef.current?.showModal();
  }

  const selectedAccount = accounts?.find((a) => a.id === accountId);
  const currencyLabel = t(
    `currency.${selectedAccount?.currency ?? "EGP"}`,
    selectedAccount?.currency ?? "EGP",
  );

  const amountNum = amount === "" ? NaN : amount;
  const isValid =
    title.trim().length > 0 &&
    accountId !== "" &&
    amount !== "" &&
    Number.isFinite(amountNum) &&
    amountNum > 0;

  function titleError(value: string): string | undefined {
    if (!value.trim()) return undefined;
    if (value.trim().length > 20) return t("transactions.add.errors.nameTooLong");
    return undefined;
  }

  function amountError(value: number | ""): string | undefined {
    if (value === "") return undefined;
    if (!Number.isFinite(value) || value <= 0) {
      return t("transactions.add.errors.amountInvalid");
    }
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = t("transactions.add.errors.nameRequired");
    else if (title.trim().length > 20)
      nextErrors.title = t("transactions.add.errors.nameTooLong");
    if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) {
      nextErrors.amount = t("transactions.add.errors.amountInvalid");
    }
    if (!editing && !accountId) {
      nextErrors.accountId = t("transactions.add.errors.accountRequired");
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
    try {
      if (editing) {
        // account_id is not patchable server-side, so it's excluded here.
        await updateTransaction.mutateAsync({ id: editing.id, patch });
      } else {
        await createTransaction.mutateAsync({ ...patch, accountId });
      }
      reset();
      closeDialog(ref);
    } catch {
      // onError already toasted; keep the modal open with the entered values.
    }
  }

  const isSaving = createTransaction.isPending || updateTransaction.isPending;

  return (
    <BaseModal
      ref={ref}
      onClose={reset}
      title={editing ? t("transactions.add.editTitle") : t("transactions.add.title")}
      actions={
        <>
          <Button
            type="submit"
            form="add-transaction-form"
            loading={isSaving}
            disabled={!isValid}
            className="btn btn-primary"
          >
            {editing ? t("actions.done") : t("transactions.add.add")}
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
          <span className="label-text text-xs">{t("transactions.add.name")}</span>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((err) => ({ ...err, title: titleError(e.target.value) }));
            }}
            placeholder={t("transactions.add.namePlaceholder")}
            maxLength={20}
            className={`input input-bordered input-sm w-full ${errors.title ? "input-error" : ""}`}
          />
          {errors.title && <span className="text-error text-xs">{errors.title}</span>}
        </label>

        <label className="flex flex-col gap-1">
          <span className="label-text text-xs">{t("transactions.add.account")}</span>
          <AccountPicker
            accounts={accounts}
            value={accountId}
            onChange={handleAccountChange}
            onAddNew={handleAddNewAccount}
            disabled={!!editing}
            placeholder={t("transactions.add.accountPlaceholder")}
            error={!!errors.accountId}
          />
          {errors.accountId && (
            <span className="text-error text-xs">{errors.accountId}</span>
          )}
          {!editing && accounts && accounts.length === 0 && (
            <span className="text-base-content/50 text-xs">
              {t("transactions.add.noAccounts")}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="label-text text-xs">{t("transactions.add.category")}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select select-bordered select-sm w-full"
          >
            {TRANSACTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`common.categories.${c}`, c)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="label-text text-xs">{t("transactions.add.amount")}</span>
            <label
              className={`input input-bordered input-sm flex w-full items-center gap-2 ${errors.amount ? "input-error" : ""}`}
            >
              <MoneyInput
                value={amount}
                max={MAX_MONEY_VALUE}
                onChange={(value) => {
                  setAmount(value);
                  setErrors((err) => ({ ...err, amount: amountError(value) }));
                }}
                placeholder={t("transactions.add.amountPlaceholder")}
                className="w-full"
              />
              <span className="text-base-content/50 shrink-0 text-xs">
                {currencyLabel}
              </span>
            </label>
            {errors.amount && <span className="text-error text-xs">{errors.amount}</span>}
          </label>
          <div className="flex flex-col gap-1">
            <span className="label-text text-xs">&nbsp;</span>
            <div className="join border-base-300 w-fit rounded-lg border">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`btn btn-sm join-item cursor-pointer ${type === "expense" ? "btn-error" : "btn-ghost"}`}
              >
                {t("common.filters.expense")}
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`btn btn-sm join-item cursor-pointer ${type === "income" ? "btn-success" : "btn-ghost"}`}
              >
                {t("common.filters.income")}
              </button>
            </div>
          </div>
        </div>

        <label className="flex w-full flex-col gap-1">
          <span className="label-text text-xs">{t("transactions.add.date")}</span>
          <input
            type="date"
            value={date}
            min={minDate()}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </label>
      </form>
      <AddBankAccountModal ref={accountModalRef} />
    </BaseModal>
  );
});
