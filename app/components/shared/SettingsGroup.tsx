/** A related set of settings/actions, set off in its own soft panel so a
 * page reads as coherent labeled groups instead of one undifferentiated
 * list. Shared between PreferencesMenu and AccountManagementSection. */
export function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-base-200/40 flex flex-col gap-3 rounded-xl p-3">
      <span className="text-base-content/50 text-[11px] font-semibold tracking-wide uppercase">
        {title}
      </span>
      {children}
    </div>
  );
}
