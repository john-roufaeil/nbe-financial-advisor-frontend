import { useState } from "react";
import { Pencil, Check, X, User, Mail, Landmark, Loader2, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMe, useUpdateProfile } from "@/queries/profile";
import type { User as UserType } from "@/types/profile";

// ── Derived display sections from the User API shape ─────────────────────────

// Real User fields plus a few display-only keys (address) that aren't on the
// User type yet — see handoff doc. Writable fields are always real User keys.
type DisplayKey = keyof UserType | "addressLine" | "city" | "country";

type Section = {
  key: string;
  icon: typeof User;
  color: string;
  titleKey: string;
  fields: { key: DisplayKey; labelKey: string; writable: boolean }[];
};

const SECTIONS: Section[] = [
  {
    key: "profile",
    icon: User,
    color: "bg-primary/10 text-primary",
    titleKey: "data.sections.profile.title",
    fields: [
      { key: "name", labelKey: "data.sections.profile.fields.fullName", writable: true },
      { key: "id", labelKey: "data.sections.profile.fields.id", writable: false },
    ],
  },
  {
    key: "contact",
    icon: Mail,
    color: "bg-secondary/10 text-secondary",
    titleKey: "data.sections.contact.title",
    fields: [
      { key: "email", labelKey: "data.sections.contact.fields.email", writable: false },
      { key: "phone", labelKey: "data.sections.contact.fields.phone", writable: true },
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
      },
      {
        key: "monthly_income",
        labelKey: "data.sections.financial.fields.monthlyIncome",
        writable: true,
      },
      {
        key: "income_bracket",
        labelKey: "data.sections.financial.fields.incomeBracket",
        writable: true,
      },
      {
        key: "income_steadiness",
        labelKey: "data.sections.financial.fields.incomeSteadiness",
        writable: true,
      },
    ],
  },
  {
    key: "address",
    icon: MapPin,
    color: "bg-accent/10 text-accent",
    titleKey: "data.sections.address.title",
    // These fields don't exist on UserType, but we'll add them as read-only mock fields
    fields: [
      {
        key: "addressLine",
        labelKey: "data.sections.address.fields.addressLine",
        writable: false,
      },
      { key: "city", labelKey: "data.sections.address.fields.city", writable: false },
      {
        key: "country",
        labelKey: "data.sections.address.fields.country",
        writable: false,
      },
    ],
  },
];

// Placeholder values shown for the seeded demo user until /users/me returns
// these fields (address fields aren't on the User type yet — see handoff doc).
// Keyed by field.key as a plain string so it also covers the address keys that
// don't exist on UserType.
const AMINA_MOCK_EMAIL = "amina.elsayed@example.com";
const AMINA_MOCK_VALUES: Record<string, string> = {
  addressLine: "12 Nile Corniche St, Zamalek",
  city: "Cairo",
  country: "Egypt",
  employment_status: "Employed",
  monthly_income: "42000.00",
  income_bracket: "High",
  income_steadiness: "Fixed",
};

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ section, user }: { section: Section; user: UserType }) {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<UserType>>({});

  const Icon = section.icon;

  function startEdit() {
    const initial: Partial<UserType> = {};
    for (const f of section.fields) {
      // Writable fields are always real User keys (address is never writable).
      if (f.writable) {
        const key = f.key as keyof UserType;
        initial[key] = user[key] ?? "";
      }
    }
    setDraft(initial);
    setEditing(true);
  }

  async function save() {
    try {
      await updateProfile.mutateAsync(draft);
      setEditing(false);
    } catch {
      // toast surfaced by mutation's onError
    }
  }

  function cancel() {
    setDraft({});
    setEditing(false);
  }

  return (
    <div className="card border-base-300 bg-base-100 border shadow-sm">
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
              <button
                type="button"
                onClick={cancel}
                className="btn btn-ghost btn-sm btn-square text-error"
                aria-label={t("actions.cancel")}
                disabled={updateProfile.isPending}
              >
                <X className="size-4" />
              </button>
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
                  <Check className="size-4" />
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="btn btn-ghost btn-sm btn-square"
              aria-label={t("actions.edit")}
            >
              <Pencil data-no-flip className="size-4" />
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {section.fields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="label-text text-base-content/50 text-xs">
                {t(field.labelKey)}
              </span>
              {editing && field.writable ? (
                <input
                  type="text"
                  value={(draft[field.key as keyof UserType] as string) ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key as keyof UserType]: e.target.value })
                  }
                  className="input input-sm input-bordered w-full"
                />
              ) : (
                <span className="text-sm font-medium">
                  {user[field.key as keyof UserType] ||
                    (user.email === AMINA_MOCK_EMAIL
                      ? AMINA_MOCK_VALUES[field.key]
                      : undefined) || (
                      <span className="text-base-content/30 italic">
                        {t("onboarding.review.empty")}
                      </span>
                    )}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="card border-base-300 bg-base-100 border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="skeleton size-9 rounded-lg" />
          <div className="skeleton h-4 flex-1 rounded" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function PersonalDataSections() {
  const { data: user, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <SectionSkeleton key={s.key} />
        ))}
      </div>
    );
  }

  if (isError || !user) {
    return <p className="text-error text-sm">Failed to load profile. Please refresh.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SECTIONS.map((s) => (
        <SectionCard key={s.key} section={s} user={user} />
      ))}
    </div>
  );
}
