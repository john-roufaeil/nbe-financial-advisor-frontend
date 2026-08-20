import { User, Landmark, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMe } from "@/queries/profile";
import {
  ProfileSectionCard,
  type Section,
} from "@/components/profile/ProfileSectionCard";
import { BankAccountsCard } from "@/components/accounts/BankAccountsCard";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import { DEPENDENTS_MAX, MONTHLY_INCOME_STEP } from "@/lib/constants/limits";

// ── Derived display sections from the User API shape ─────────────────────────

const EMPLOYMENT_OPTIONS = [
  "employed",
  "selfEmployed",
  "student",
  "unemployed",
  "retired",
] as const;

const STEADINESS_OPTIONS = ["steady", "variable", "seasonal"] as const;

const SECTIONS: Section[] = [
  {
    key: "profile",
    icon: User,
    color: "bg-primary/10 text-primary",
    titleKey: "common.sections.profile.title",
    fields: [
      {
        key: "name",
        labelKey: "common.sections.profile.fields.fullName",
        writable: true,
        placeholderKey: "common.sections.profile.fields.fullNamePlaceholder",
      },
      {
        key: "phone",
        labelKey: "common.sections.contact.fields.phone",
        writable: true,
        ltr: true,
        phone: true,
        placeholderKey: "common.sections.contact.fields.phonePlaceholder",
      },
      { key: "id", labelKey: "common.sections.profile.fields.id", writable: false },
      { key: "email", labelKey: "common.sections.contact.fields.email", writable: false },
    ],
  },
  {
    key: "financial",
    icon: Landmark,
    color: "bg-info/10 text-info",
    titleKey: "common.sections.financial.title",
    fields: [
      {
        key: "employment_status",
        labelKey: "common.sections.financial.fields.employmentStatus",
        writable: true,
        options: EMPLOYMENT_OPTIONS.map((opt) => ({
          value: opt,
          labelKey: `onboarding.income.options.${opt}`,
        })),
      },
      {
        key: "monthly_income",
        labelKey: "common.sections.financial.fields.monthlyIncome",
        writable: true,
        currency: true,
        step: MONTHLY_INCOME_STEP,
        placeholderKey: "common.sections.financial.fields.monthlyIncomePlaceholder",
      },
      {
        key: "income_steadiness",
        labelKey: "common.sections.financial.fields.incomeSteadiness",
        writable: true,
        options: STEADINESS_OPTIONS.map((opt) => ({
          value: opt,
          labelKey: `onboarding.income.steadinessOptions.${opt}`,
        })),
      },
      {
        key: "dependents_count",
        labelKey: "common.sections.financial.fields.dependentsCount",
        writable: true,
        count: true,
        max: DEPENDENTS_MAX,
        placeholderKey: "common.sections.financial.fields.dependentsCountPlaceholder",
      },
    ],
  },
];

// ── Public export ─────────────────────────────────────────────────────────────

/**
 * `restricted` (declined terms_of_service — see RequireAuth.tsx) drops this
 * down to just the "profile" card (name/phone/id/email): the financial
 * profile and linked bank accounts are the app's actual financial-advice
 * surface, which a declined-terms account shouldn't be using.
 *
 * Profile/Financial/Bank-accounts render as three SettingsGroup subcategory
 * panels under one shared header — the same "icon + title" header
 * PreferencesMenu and AccountManagementSection use — rather than three
 * separately bordered cards.
 */
export function PersonalDataSections({ restricted = false }: { restricted?: boolean }) {
  const { t } = useTranslation();
  const { data: user, isLoading, isError, refetch } = useMe();
  const sections = restricted ? SECTIONS.filter((s) => s.key === "profile") : SECTIONS;

  const header = (
    <div className="flex items-center gap-2">
      <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
        <User className="size-4.5" />
      </span>
      <h2 className="card-title flex-1 text-base">
        {t("common.sections.personal.title")}
      </h2>
    </div>
  );

  if (isLoading) {
    return (
      <div className="animate-entry flex flex-col gap-3">
        {header}
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((s) => (
              <CardSkeleton
                key={s.key}
                bare
                icon={s.icon}
                rows={[{ kind: "fieldGrid", fields: s.fields.length }]}
              />
            ))}
          </div>
          {!restricted && (
            <CardSkeleton
              bare
              icon={CreditCard}
              rows={[{ kind: "progress" }, { kind: "progress" }]}
            />
          )}
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="animate-entry flex min-w-0 flex-col gap-3">
      {header}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {sections.map((s) => (
            <ProfileSectionCard key={s.key} section={s} user={user} />
          ))}
        </div>
        {!restricted && <BankAccountsCard />}
      </div>
    </div>
  );
}
