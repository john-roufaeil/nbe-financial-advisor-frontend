import { Link, useParams } from "react-router";
import { Plus, ArrowLeftRight, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AddItemFab() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  return (
    <div className="dropdown dropdown-top dropdown-end fixed inset-e-10 bottom-10 z-20 h-12 w-12 cursor-pointer">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-circle btn-primary h-full w-full shadow-lg"
        aria-label={t("dashboard.addItem")}
      >
        <Plus className="size-6" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-20 mb-2 w-56 border p-2 shadow-md"
      >
        <li>
          <Link to={`/${lang}/transactions?add=1`}>
            <ArrowLeftRight className="size-4" />
            {t("data.addTransaction.add")}
          </Link>
        </li>
        <li>
          <Link to={`/${lang}/documents?add=1`}>
            <FileText className="size-4" />
            {t("data.addDocument.add")}
          </Link>
        </li>
      </ul>
    </div>
  );
}
