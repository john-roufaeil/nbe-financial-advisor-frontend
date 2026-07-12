import { useRef } from "react";
import { Link, useParams } from "react-router";
import { Plus, ArrowLeftRight, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import { Z_FLOATING_ACTION } from "@/lib/z-index";

export function AddItemFab() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`dropdown dropdown-top dropdown-end fixed inset-e-6 bottom-6 ${Z_FLOATING_ACTION} h-12 w-12 cursor-pointer`}
    >
      <Tooltip
        content={t("dashboard.addItem")}
        position="start"
        className="h-full w-full"
      >
        <div
          ref={triggerRef}
          tabIndex={0}
          role="button"
          onMouseDown={(e) => {
            // The dropdown is open exactly when this element is focused (daisyUI's
            // `:focus-within` pattern). A second click while it's already focused
            // would otherwise just re-focus it (native default) and leave it open —
            // pre-empt that on mousedown, before focus moves, so it toggles closed.
            if (document.activeElement === triggerRef.current) {
              e.preventDefault();
              triggerRef.current?.blur();
            }
          }}
          className="btn btn-circle btn-primary h-full w-full shadow-lg"
          aria-label={t("dashboard.addItem")}
        >
          <Plus className="size-6" />
        </div>
      </Tooltip>
      <ul
        tabIndex={0}
        className={`dropdown-content menu bg-base-100 border-base-300 rounded-box ${Z_FLOATING_ACTION} mb-2 max-h-[70vh] w-56 max-w-[90vw] overflow-y-auto border-2 p-2 shadow-2xl`}
      >
        <li>
          <Link to={`/${lang}/transactions`} state={{ openAdd: true }}>
            <ArrowLeftRight className="size-4" />
            {t("transactions.add.add")}
          </Link>
        </li>
        <li>
          <Link to={`/${lang}/bank-statements`} state={{ openAdd: true }}>
            <FileText className="size-4" />
            {t("bankStatements.add.add")}
          </Link>
        </li>
      </ul>
    </div>
  );
}
