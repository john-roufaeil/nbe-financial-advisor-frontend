import { User, Landmark, CreditCard } from "lucide-react";
import { useMe } from "@/queries/profile";
import {
  ProfileSectionCard,
  type Section,
} from "@/components/profile/ProfileSectionCard";
import { BankAccountsCard } from "@/components/accounts/BankAccountsCard";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";

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
    ],
  },
];

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
        <ProfileSectionCard key={s.key} section={s} user={user} />
      ))}
      <BankAccountsCard />
    </div>
  );
}
