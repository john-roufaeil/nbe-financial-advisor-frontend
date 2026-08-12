import { useTranslation } from "react-i18next";
import { useToastStore } from "@/store/use-toast-store";
import { ToggleSwitch } from "@/components/shared/forms/ToggleSwitch";

/** Shared body of the date/time/number/compact-numbers switchers: a forced-LTR ToggleSwitch that toasts the new value on change. */
export function PreferenceFormatSwitch<T extends string>({
  options,
  value,
  onChange,
  i18nPrefix,
  toastKey,
}: {
  options: readonly [T, T];
  value: T;
  onChange: (next: T) => void;
  /** e.g. "settings.dateFormat" — must have `.label` plus one key per option. */
  i18nPrefix: string;
  /** e.g. "toast.dateFormatChanged" — receives `{ format }`. */
  toastKey: string;
}) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);

  const labels = Object.fromEntries(
    options.map((opt) => [opt, t(`${i18nPrefix}.${opt}`)]),
  ) as Record<T, string>;

  return (
    <ToggleSwitch
      value={value}
      options={options}
      labels={labels}
      forceLtrOrder
      onChange={(next) => {
        onChange(next);
        showToast(t(toastKey, { format: labels[next] }), "info");
      }}
      aria-label={t(`${i18nPrefix}.label`)}
    />
  );
}
