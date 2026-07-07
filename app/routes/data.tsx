import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User, Receipt, FileText } from "lucide-react";
import { PersonalDataSections } from "@/components/data/PersonalDataSections";
import { TransactionsTab } from "@/components/data/TransactionsTab";
import { DocumentsTab } from "@/components/data/DocumentsTab";
import { ReplanFab } from "@/components/data/ReplanFab";
import { usePageTitle } from "@/lib/use-page-title";

const TABS = ["personalData", "transactions", "documents"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, typeof User> = {
  personalData: User,
  transactions: Receipt,
  documents: FileText,
};

export default function Data() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Tab>("personalData");
  usePageTitle(t(`data.${active}`));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          className="border-base-300 bg-base-200 flex w-fit gap-1 rounded-full border p-1"
        >
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab];
            const isActive = active === tab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(tab)}
                className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-content shadow-sm"
                    : "text-base-content/70 hover:bg-base-300"
                }`}
              >
                <Icon className="size-4" />
                {t(`data.${tab}`)}
              </button>
            );
          })}
        </div>
        <ReplanFab />
      </div>

      {active === "personalData" && <PersonalDataSections />}
      {active === "transactions" && <TransactionsTab />}
      {active === "documents" && <DocumentsTab />}
    </div>
  );
}
