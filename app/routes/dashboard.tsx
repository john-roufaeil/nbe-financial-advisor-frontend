import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">{t("nav.dashboard")}</h1>
      <p>Placeholder — replace with real content.</p>
    </div>
  );
}