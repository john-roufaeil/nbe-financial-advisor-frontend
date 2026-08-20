/** A related set of settings/actions, set off in its own soft panel so a
 * page reads as coherent labeled groups instead of one undifferentiated
 * list. Shared between PreferencesMenu, AccountManagementSection, and
 * PersonalDataSections. */
export function SettingsGroup({
  title,
  action,
  onSubmit,
  children,
}: {
  title: string;
  /** e.g. an edit/save toggle — rendered end-aligned next to the title,
   * for a group whose action applies to the whole group at once rather
   * than to one row within it (contrast AccountManagementSection's Row,
   * which puts its action per-row instead). */
  action?: React.ReactNode;
  /** Renders the panel as a `<form>` instead of a `<div>` — for a group
   * whose action is a submit button (e.g. ProfileSectionCard's edit/save),
   * so Enter-to-submit inside its fields keeps working. */
  onSubmit?: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  const className = "bg-base-200/40 flex flex-col gap-3 rounded-xl p-3";
  const header = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-base-content/50 text-[11px] font-semibold tracking-wide uppercase">
        {title}
      </span>
      {action}
    </div>
  );

  if (onSubmit) {
    return (
      <form className={className} onSubmit={onSubmit}>
        {header}
        {children}
      </form>
    );
  }

  return (
    <div className={className}>
      {header}
      {children}
    </div>
  );
}
