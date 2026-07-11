import { Link, useParams } from "react-router";
import { Plus, ArrowLeftRight, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";

export function AddItemFab() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  return (
    <div className="dropdown dropdown-top dropdown-end fixed inset-e-6 bottom-6 z-20 h-12 w-12 cursor-pointer">
      <Tooltip
        content={t("dashboard.addItem")}
        position="start"
        className="h-full w-full"
      >
        <div
          tabIndex={0}
          role="button"
          className="btn btn-circle btn-primary h-full w-full shadow-lg"
          aria-label={t("dashboard.addItem")}
        >
          <Plus className="size-6" />
        </div>
      </Tooltip>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-20 mb-2 w-56 border p-2 shadow-md"
      >
        <li>
          <Link to={`/${lang}/transactions`} state={{ openAdd: true }}>
            <ArrowLeftRight className="size-4" />
            {t("data.addTransaction.add")}
          </Link>
        </li>
        <li>
          <Link to={`/${lang}/documents`} state={{ openAdd: true }}>
            <FileText className="size-4" />
            {t("data.addDocument.add")}
          </Link>
        </li>
      </ul>
    </div>
  );
}
