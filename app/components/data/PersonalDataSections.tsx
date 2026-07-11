import { useRef, useState } from "react";
import {
  Pencil,
  Check,
  X,
  User,
  Landmark,
  Loader2,
  CreditCard,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useMe, useUpdateProfile } from "@/queries/profile";
import { useAccounts, useDeleteAccount } from "@/queries/accounts";
import { useConfirmStore } from "@/store/use-confirm-store";
import { BankBadge } from "@/components/shared/BankBadge";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import { AddBankAccountModal } from "@/components/data/AddBankAccountModal";
import { EditBankAccountModal } from "@/components/data/EditBankAccountModal";
import type { User as UserType } from "@/types/profile";
import type { BankAccount } from "@/types/account";
import { CardSkeleton, ErrorState } from "@/components/shared/QueryState";

// ── Derived display sections from the User API shape ─────────────────────────

const EMPLOYMENT_OPTIONS = [
  "employed",
  "selfEmployed",
  "student",
  "unemployed",
  "retired",
] as const;

const STEADINESS_OPTIONS = ["steady", "variable", "seasonal"] as const;

type Field = {
  key: keyof UserType;
  labelKey: string;
  writable: boolean;
  currency?: boolean;
  ltr?: boolean;
  phone?: boolean;
  placeholderKey?: string;
  options?: { value: string; labelKey: string }[];
};

type Section = {
  key: string;
  icon: typeof User;
  color: string;
  titleKey: string;
  fields: Field[];
};

const SECTIONS: Section[] = [
  {
    key: "profile",
    icon: User,
    color: "bg-primary/10 text-primary",
    titleKey: "data.sections.profile.title",
    fields: [
      {
        key: "name",
        labelKey: "data.sections.profile.fields.fullName",
        writable: true,
        placeholderKey: "data.sections.profile.fields.fullNamePlaceholder",
      },
      { key: "id", labelKey: "data.sections.profile.fields.id", writable: false },
      { key: "email", labelKey: "data.sections.contact.fields.email", writable: false },
      {
        key: "phone",
        labelKey: "data.sections.contact.fields.phone",
        writable: true,
        ltr: true,
        phone: true,
        placeholderKey: "data.sections.contact.fields.phonePlaceholder",
      },
    ],
  },
  {
    key: "financial",
    icon: Landmark,
    color: "bg-info/10 text-info",
    titleKey: "data.sections.financial.title",
    fields: [
      {
        key: "employment_status",
        labelKey: "data.sections.financial.fields.employmentStatus",
        writable: true,
        options: EMPLOYMENT_OPTIONS.map((opt) => ({
          value: opt,
          labelKey: `onboarding.income.options.${opt}`,
        })),
      },
      {
        key: "monthly_income",
        labelKey: "data.sections.financial.fields.monthlyIncome",
        writable: true,
        currency: true,
        placeholderKey: "data.sections.financial.fields.monthlyIncomePlaceholder",
      },
      {
        key: "income_steadiness",
        labelKey: "data.sections.financial.fields.incomeSteadiness",
        writable: true,
        options: STEADINESS_OPTIONS.map((opt) => ({
          value: opt,
          labelKey: `onboarding.income.steadinessOptions.${opt}`,
        })),
      },
    ],
  },
];

// ── Field editing/display ─────────────────────────────────────────────────────

function FieldEditor({
  field,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  if (field.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-sm select-bordered w-full"
      >
        <option value="" disabled>
          {t("onboarding.review.empty")}
        </option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    );
  }

  if (field.phone) {
    return (
      <>
        <PhoneInput
          className={`input input-sm input-bordered w-full ${error ? "input-error" : ""}`}
          defaultCountry="EG"
          international
          value={value}
          onChange={(next) => onChange(next ?? "")}
          placeholder={t(field.placeholderKey ?? field.labelKey)}
        />
        {error && <span className="text-error text-xs">{error}</span>}
      </>
    );
  }

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(field.placeholderKey ?? field.labelKey)}
        maxLength={field.key === "name" ? 20 : undefined}
        className={`input input-sm input-bordered w-full ${error ? "input-error" : ""}`}
      />
      {error && <span className="text-error text-xs">{error}</span>}
    </>
  );
}

function FieldValue({ field, value }: { field: Field; value?: string }) {
  const { t } = useTranslation();

  const option = field.options?.find((opt) => opt.value === value);
  if (option) {
    return <span className="text-sm font-medium">{t(option.labelKey)}</span>;
  }

  if (!value) {
    return (
      <span className="text-base-content/30 text-sm font-medium italic">
        {t("onboarding.review.empty")}
      </span>
    );
  }

  if (field.currency) {
    return (
      <Money className="text-sm font-medium">
        {value} {t("currency.EGP")}
      </Money>
    );
  }

  if (field.ltr) {
    return (
      <span className="text-sm font-medium">
        <bdi dir="ltr">{value.replace(/\s+/g, "")}</bdi>
      </span>
    );
  }

  return <span className="text-sm font-medium">{value}</span>;
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ section, user }: { section: Section; user: UserType }) {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<UserType>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof UserType, string>>>({});

  const Icon = section.icon;

  function startEdit() {
    const initial: Partial<UserType> = {};
    for (const f of section.fields) {
      if (f.writable) {
        const key = f.key as keyof UserType;
        initial[key] = user[key] ?? "";
      }
    }
    setDraft(initial);
    setErrors({});
    setEditing(true);
  }

  async function save() {
    const nextErrors: Partial<Record<keyof UserType, string>> = {};
    const phoneField = section.fields.find((f) => f.phone);
    if (phoneField) {
      const value = (draft[phoneField.key] as string) ?? "";
      if (value && !isValidPhoneNumber(value)) {
        nextErrors[phoneField.key] = t("data.sections.errors.phoneInvalid");
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updateProfile.mutateAsync(draft);
      setEditing(false);
    } catch {
      /* Error is gracefully surfaced globally via the mutation's onError toast handler */
    }
  }

  function cancel() {
    setDraft({});
    setErrors({});
    setEditing(false);
  }

  return (
    <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ${section.color}`}
          >
            <Icon className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">{t(section.titleKey)}</h2>
          {editing ? (
            <div dir="ltr" className="flex gap-1">
              <Tooltip content={t("actions.cancel")}>
                <button
                  type="button"
                  onClick={cancel}
                  className="btn btn-ghost btn-sm btn-square text-error"
                  aria-label={t("actions.cancel")}
                  disabled={updateProfile.isPending}
                >
                  <X className="size-4" />
                </button>
              </Tooltip>
              <Tooltip content={t("actions.done")}>
                <button
                  type="button"
                  onClick={save}
                  className="btn btn-ghost btn-sm btn-square text-success"
                  aria-label={t("actions.done")}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check data-no-flip className="size-4" />
                  )}
                </button>
              </Tooltip>
            </div>
          ) : (
            <Tooltip content={t("actions.edit")}>
              <button
                type="button"
                onClick={startEdit}
                className="btn btn-ghost btn-sm btn-square"
                aria-label={t("actions.edit")}
              >
                <Pencil data-no-flip className="size-4" />
              </button>
            </Tooltip>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {section.fields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="label-text text-base-content/50 text-xs">
                {t(field.labelKey)}
              </span>
              {editing && field.writable ? (
                <FieldEditor
                  field={field}
                  value={(draft[field.key] as string) ?? ""}
                  error={errors[field.key]}
                  onChange={(value) => {
                    setDraft({ ...draft, [field.key]: value });
                    if (errors[field.key])
                      setErrors({ ...errors, [field.key]: undefined });
                  }}
                />
              ) : (
                <FieldValue field={field} value={user[field.key]} />
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bank accounts ─────────────────────────────────────────────────────────────

function AccountRow({
  account,
  onEdit,
  onDelete,
}: {
  account: BankAccount;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const currencyLabel = t(`currency.${account.currency}`, account.currency);

  return (
    <li className="border-base-300 bg-base-100 flex items-center gap-3 rounded-lg border p-3">
      <BankBadge
        bank={account.bank_name}
        className="flex-1"
        subtitle={
          <>
            <span dir="ltr">{account.masked_account_number}</span>
            {account.account_type
              ? ` · ${t(`data.addAccount.accountTypes.${account.account_type}`, account.account_type)}`
              : ""}
            {account.is_active ? "" : ` · ${t("data.sections.accounts.inactive")}`}
          </>
        }
      />
      <Money className="shrink-0 text-sm font-semibold tabular-nums">
        {Number(account.current_balance).toLocaleString()} {currencyLabel}
      </Money>
      <div className="flex shrink-0 gap-1">
        <Tooltip content={t("actions.edit")}>
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-ghost btn-sm btn-square"
            aria-label={t("actions.edit")}
          >
            <Pencil data-no-flip className="size-4" />
          </button>
        </Tooltip>
        <Tooltip content={t("actions.remove")}>
          <button
            type="button"
            onClick={onDelete}
            className="btn btn-ghost btn-sm btn-square text-error"
            aria-label={t("actions.remove")}
          >
            <Trash2 data-no-flip className="size-4" />
          </button>
        </Tooltip>
      </div>
    </li>
  );
}

function BankAccountsCard() {
  const { t } = useTranslation();
  const { data: accounts, isPending, isError } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const confirm = useConfirmStore((s) => s.confirm);
  const addRef = useRef<HTMLDialogElement>(null);
  const editRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  function openEdit(account: BankAccount) {
    setEditing(account);
    editRef.current?.showModal();
  }

  function confirmDelete(account: BankAccount) {
    confirm({
      title: t("confirm.deleteAccountTitle"),
      message: t("confirm.deleteMessage"),
      onConfirm: () => deleteAccount.mutate(account.id),
    });
  }

  if (isPending) {
    return (
      <CardSkeleton
        icon={CreditCard}
        className="animate-entry sm:col-span-2"
        rows={[{ kind: "progress" }, { kind: "progress" }]}
      />
    );
  }

  if (isError) {
    return (
      <div className="card border-base-300 bg-base-100 border shadow-sm sm:col-span-2">
        <div className="card-body p-4">
          <p className="text-error text-sm">{t("data.sections.accounts.error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm sm:col-span-2">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-success/10 text-success grid size-9 shrink-0 place-items-center rounded-lg">
            <CreditCard className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">
            {t("data.sections.accounts.title")}
          </h2>
          <Tooltip content={t("data.addAccount.add")}>
            <button
              type="button"
              onClick={() => addRef.current?.showModal()}
              className="btn btn-ghost btn-sm btn-square"
              aria-label={t("data.addAccount.add")}
            >
              <Plus data-no-flip className="size-4" />
            </button>
          </Tooltip>
        </div>

        {accounts.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onEdit={() => openEdit(account)}
                onDelete={() => confirmDelete(account)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-base-content/50 text-sm">
            {t("data.sections.accounts.empty")}
          </p>
        )}
      </div>

      <AddBankAccountModal ref={addRef} />
      <EditBankAccountModal ref={editRef} account={editing} />
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function PersonalDataSections() {
  const { data: user, isLoading, isError, refetch } = useMe();

  if (isLoading) {
    return (
      <div className="animate-entry grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <CardSkeleton
            key={s.key}
            icon={s.icon}
            rows={[{ kind: "fieldGrid", fields: s.fields.length }]}
          />
        ))}
        <div className="sm:col-span-2">
          <CardSkeleton
            icon={CreditCard}
            rows={[{ kind: "progress" }, { kind: "progress" }]}
          />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SECTIONS.map((s) => (
        <SectionCard key={s.key} section={s} user={user} />
      ))}
      <BankAccountsCard />
    </div>
  );
}
