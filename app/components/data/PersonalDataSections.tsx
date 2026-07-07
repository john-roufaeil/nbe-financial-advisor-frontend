import { useState } from "react";
import { Pencil, Check, X, User, Mail, MapPin, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  usePersonalDataStore,
  type PersonalDataState,
} from "@/store/use-personal-data-store";

type SectionKey = "profile" | "contact" | "address" | "financial";

const SECTION_ICONS: Record<SectionKey, typeof User> = {
  profile: User,
  contact: Mail,
  address: MapPin,
  financial: Landmark,
};

const SECTION_COLORS: Record<SectionKey, string> = {
  profile: "bg-primary/10 text-primary",
  contact: "bg-secondary/10 text-secondary",
  address: "bg-accent/10 text-accent",
  financial: "bg-info/10 text-info",
};

function SectionCard({ section }: { section: SectionKey }) {
  const { t } = useTranslation();
  const values = usePersonalDataStore((s) => s[section]);
  const updateSection = usePersonalDataStore((s) => s.updateSection);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(values);

  const Icon = SECTION_ICONS[section];
  const fieldKeys = Object.keys(values);

  function startEdit() {
    setDraft(values);
    setEditing(true);
  }
  function save() {
    updateSection(section, draft as PersonalDataState[SectionKey]);
    setEditing(false);
  }
  function cancel() {
    setDraft(values);
    setEditing(false);
  }

  return (
    <div className="card border-base-300 bg-base-100 border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ${SECTION_COLORS[section]}`}
          >
            <Icon className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">
            {t(`data.sections.${section}.title`)}
          </h2>
          {editing ? (
            <div dir="ltr" className="flex gap-1">
              <button
                type="button"
                onClick={cancel}
                className="btn btn-ghost btn-sm btn-square text-error"
                aria-label={t("actions.cancel")}
              >
                <X className="size-4" />
              </button>
              <button
                type="button"
                onClick={save}
                className="btn btn-ghost btn-sm btn-square text-success"
                aria-label={t("actions.done")}
              >
                <Check className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="btn btn-ghost btn-sm btn-square"
              aria-label={t("actions.edit")}
            >
              <Pencil className="size-4" />
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {fieldKeys.map((key) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="label-text text-base-content/50 text-xs">
                {t(`data.sections.${section}.fields.${key}`)}
              </span>
              {editing ? (
                <input
                  type="text"
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="input input-sm input-bordered w-full"
                />
              ) : (
                <span className="text-sm font-medium">
                  {values[key as keyof typeof values]}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PersonalDataSections() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SectionCard section="profile" />
      <SectionCard section="contact" />
      <SectionCard section="address" />
      <SectionCard section="financial" />
    </div>
  );
}
