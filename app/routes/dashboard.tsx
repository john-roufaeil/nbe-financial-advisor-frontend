import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="container py-6">
      <div className="card bg-base-100 rounded-box shadow-sm">
        <div className="card-body">
          <h1 className="card-title">{t("nav.dashboard")}</h1>
          <button className="btn btn-primary w-fit">{t("nav.dashboard")}</button>
        </div>
      </div>
    </div>
  );
}
