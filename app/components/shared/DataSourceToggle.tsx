import { Database, Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LinkToggle } from "@/components/shared/LinkToggle";
import { useDataSourceStore } from "@/store/use-data-source-store";
import { useToastStore } from "@/store/use-toast-store";

const DATA_SOURCE_OPTIONS = ["mock", "backend"] as const;

export function DataSourceToggle({
  variant,
  className,
}: {
  variant?: "link" | "btn-ghost";
  className?: string;
}) {
  const { t } = useTranslation();
  const source = useDataSourceStore((s) => s.source);
  const setSource = useDataSourceStore((s) => s.setSource);
  const showToast = useToastStore((s) => s.show);

  const labels = {
    mock: t("dashboard.dataSource.mock"),
    backend: t("dashboard.dataSource.backend"),
  };

  return (
    <LinkToggle
      value={source}
      options={DATA_SOURCE_OPTIONS}
      labels={labels}
      icons={{ mock: Database, backend: Cloud }}
      onChange={(next) => {
        setSource(next);
        showToast(t("toast.dataSourceChanged", { source: labels[next] }), "info");
      }}
      aria-label={t("dashboard.dataSource.mock")}
      variant={variant}
      className={className}
    />
  );
}
