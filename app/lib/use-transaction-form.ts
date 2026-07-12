import { useEffect, useRef, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TRANSACTION_CATEGORIES, type Transaction } from "@/types/transaction";
import { useCreateTransaction, useUpdateTransaction } from "@/queries/transactions";
import { useAccounts } from "@/queries/accounts";

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

export interface TransactionFormValues {
  title: string;
  accountId: string;
  category: string;
  type: "income" | "expense";
  amount: number | "";
  date: string;
}

function emptyValues(): TransactionFormValues {
  return {
    title: "",
    accountId: "",
    category: TRANSACTION_CATEGORIES[0],
    type: "expense",
    amount: "",
    date: today(),
  };
}

/** All form state, validation, and submit wiring for AddTransactionModal. */
export function useTransactionForm(
  editing: Transaction | null | undefined,
  ref: Ref<HTMLDialogElement>,
) {
  const { t } = useTranslation();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const { data: accounts } = useAccounts();
  const accountModalRef = useRef<HTMLDialogElement>(null);
  const awaitingNewAccountRef = useRef(false);

  const schema = z
    .object({
      title: z
        .string()
        .trim()
        .min(1, t("transactions.add.errors.nameRequired"))
        .max(20, t("transactions.add.errors.nameTooLong")),
      accountId: z.string(),
      category: z.string(),
      type: z.enum(["income", "expense"]),
      amount: z.union([z.number(), z.literal("")]),
      date: z.string(),
    })
    .superRefine((values, ctx) => {
      if (!Number.isFinite(values.amount) || (values.amount as number) <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: t("transactions.add.errors.amountInvalid"),
        });
      }
      if (!editing && !values.accountId) {
        ctx.addIssue({
          code: "custom",
          path: ["accountId"],
          message: t("transactions.add.errors.accountRequired"),
        });
      }
    });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: emptyValues(),
  });
  const { control, register, handleSubmit, watch, setValue, reset, formState } = form;

  useEffect(() => {
    if (editing) {
      reset({
        title: editing.title,
        accountId: editing.accountId ?? "",
        category: editing.category,
        type: editing.type,
        amount: editing.amount,
        date: editing.datetime.slice(0, 10),
      });
    } else {
      reset(emptyValues());
    }
  }, [editing, reset]);

  const accountId = watch("accountId");

  // Default to the user's first active account once accounts load, and
  // auto-select the account just created via the "add new account" flow.
  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    if (editing) return;
    if (awaitingNewAccountRef.current) {
      const newest = [...accounts].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      )[0];
      setValue("accountId", newest.id, { shouldValidate: true });
      awaitingNewAccountRef.current = false;
      return;
    }
    if (!accountId) {
      const account = accounts.find((a) => a.is_active) ?? accounts[0];
      setValue("accountId", account.id, { shouldValidate: true });
    }
  }, [accounts, editing, accountId, setValue]);

  function resetForm() {
    reset(emptyValues());
  }

  function handleAddNewAccount() {
    awaitingNewAccountRef.current = true;
    accountModalRef.current?.showModal();
  }

  const selectedAccount = accounts?.find((a) => a.id === accountId);
  const currencyLabel = t(
    `currency.${selectedAccount?.currency ?? "EGP"}`,
    selectedAccount?.currency ?? "EGP",
  );

  async function onSubmit(values: TransactionFormValues) {
    const patch = {
      datetime: `${values.date}T00:00:00`,
      title: values.title.trim(),
      category: values.category,
      type: values.type,
      amount: values.amount as number,
    };
    try {
      if (editing) {
        // account_id is not patchable server-side, so it's excluded here.
        await updateTransaction.mutateAsync({ id: editing.id, patch });
      } else {
        await createTransaction.mutateAsync({ ...patch, accountId: values.accountId });
      }
      resetForm();
      closeDialog(ref);
    } catch {
      // onError already toasted; keep the modal open with the entered values.
    }
  }

  const isSaving = createTransaction.isPending || updateTransaction.isPending;

  return {
    control,
    register,
    errors: formState.errors,
    isValid: formState.isValid,
    accounts,
    accountModalRef,
    currencyLabel,
    isSaving,
    resetForm,
    handleAddNewAccount,
    handleFormSubmit: handleSubmit(onSubmit),
    today,
    minDate,
    closeDialog: () => closeDialog(ref),
  };
}
