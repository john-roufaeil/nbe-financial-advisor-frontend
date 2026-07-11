import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Settings2, Clock, Globe, Database, X } from "lucide-react";
import { TimeFormatSwitcher } from "@/components/shared/TimeFormatSwitcher";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/routes/lang-layout";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { useToastStore } from "@/store/use-toast-store";
import { Tooltip } from "./Tooltip";

const PANEL_WIDTH = 288; // w-72, used only for initial JS positioning math; actual rendered width is clamped by CSS (max-w-[90vw])
const PANEL_GAP = 8;
const DATA_SOURCE_OPTIONS: readonly [DataSource, DataSource] = ["mock", "backend"];

function LanguageToggle({ onAfterChange }: { onAfterChange?: () => void }) {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const showToast = useToastStore((s) => s.show);

  const labels: Record<SupportedLanguage, string> = {
    en: t("settings.languageNames.en"),
    ar: t("settings.languageNames.ar"),
  };

  function switchTo(next: SupportedLanguage) {
    document.documentElement.lang = next;
    document.documentElement.dir = RTL_LANGUAGES.includes(next) ? "rtl" : "ltr";
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    void i18n.changeLanguage(next);
    showToast(t("toast.languageChanged", { language: labels[next] }), "info");
    // Navigating to the new /:lang segment reuses this route's component
    // instance, so the panel's `open` state wouldn't otherwise reset itself.
    onAfterChange?.();
    if (next !== lang) {
      const rest = location.pathname.replace(`/${lang}`, "");
      navigate(`/${next}${rest}${location.search}`);
    }
  }

  return (
    <ToggleSwitch
      value={(lang as SupportedLanguage) ?? SUPPORTED_LANGUAGES[0]}
      options={SUPPORTED_LANGUAGES}
      labels={labels}
      forceLtrOrder
      onChange={switchTo}
      aria-label={t("settings.language")}
    />
  );
}

function DataSourceSwitch() {
  const { t } = useTranslation();
  const source = useDataSourceStore((s) => s.source);
  const setSource = useDataSourceStore((s) => s.setSource);
  const showToast = useToastStore((s) => s.show);

  const labels: Record<DataSource, string> = {
    mock: t("dashboard.dataSource.mock"),
    backend: t("dashboard.dataSource.backend"),
  };

  return (
    <ToggleSwitch
      value={source}
      options={DATA_SOURCE_OPTIONS}
      labels={labels}
      forceLtrOrder
      onChange={(next) => {
        setSource(next);
        showToast(t("toast.dataSourceChanged", { source: labels[next] }), "info");
      }}
      aria-label={t("dashboard.dataSource.title")}
    />
  );
}

export function PreferencesMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function reposition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const isRtl = document.documentElement.dir === "rtl";
      // Align the panel's trailing edge (end, per document direction) with the trigger's trailing edge.
      const left = isRtl ? rect.left : rect.right - PANEL_WIDTH;
      setPosition({
        top: rect.bottom + PANEL_GAP,
        left: Math.max(
          PANEL_GAP,
          Math.min(left, window.innerWidth - PANEL_WIDTH - PANEL_GAP),
        ),
      });
    }

    reposition();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function onClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="btn btn-outline btn-sm bg-base-200 gap-2"
      >
        <Settings2 className="size-4" />
        {t("data.sections.preferences.title")}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={t("data.sections.preferences.title")}
            style={{ top: position.top, left: position.left }}
            className="border-base-300 bg-base-100 text-base-content animate-a11y-panel-in fixed z-50 max-h-[80vh] w-72 max-w-[90vw] overflow-y-auto rounded-2xl border p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Settings2 className="size-4" />
                {t("data.sections.preferences.title")}
              </h2>
              <Tooltip content={t("actions.close")}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  aria-label={t("actions.close")}
                  className="btn btn-ghost btn-xs btn-square"
                >
                  <X className="size-4" />
                </button>
              </Tooltip>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
                  <Clock className="size-3.5" />
                  {t("settings.timeFormat.label")}
                </span>
                <TimeFormatSwitcher />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
                  <Globe className="size-3.5" />
                  {t("settings.language")}
                </span>
                <LanguageToggle onAfterChange={() => setOpen(false)} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-base-content/70 flex items-center gap-1.5 text-xs font-medium">
                  <Database className="size-3.5" />
                  {t("dashboard.dataSource.title")}
                </span>
                <DataSourceSwitch />
              </label>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
