import { useTranslation } from "react-i18next";

/** dd/mm/yyyy for LTR; reversed (yyyy/mm/dd) for RTL so it still reads start-to-end naturally. */
function formatDisplay(iso: string, rtl: boolean) {
  const [y, m, d] = iso.split("-");
  return rtl ? `${y}/${m}/${d}` : `${d}/${m}/${y}`;
}

export function DateField({
  value,
  onChange,
  label,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: string;
  max?: string;
}) {
  const { i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl";
  const placeholder = rtl ? "yyyy/mm/dd" : "dd/mm/yyyy";

  return (
    <label className="text-base-content/50 flex items-center gap-1.5 text-xs">
      <span className="w-9 shrink-0">{label}</span>
      <span className="relative block min-w-0 flex-1">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          style={rtl ? { transform: "scaleX(-1)" } : undefined}
          className="input input-bordered input-sm w-full text-transparent caret-transparent"
        />
        <span className="text-base-content pointer-events-none absolute inset-0 flex items-center ps-3 pe-7 text-sm">
          {value ? (
            formatDisplay(value, rtl)
          ) : (
            <span className="text-base-content/40">{placeholder}</span>
          )}
        </span>
      </span>
    </label>
  );
}
