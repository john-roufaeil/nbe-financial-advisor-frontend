import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="container py-6">
      <div className="card bg-base-100 rounded-box shadow-sm">
        <div className="card-body">
          <h1 className="card-title">{t("nav.err")}</h1>
          <button className="btn btn-primary w-fit">{t("nav.dashboard")}</button>
          <button className="btn btn-secondary w-fit">{t("nav.dashboard")}</button>
          <button className="btn btn-accent w-fit">{t("nav.dashboard")}</button>
          <button className="btn btn-active w-fit">{t("nav.dashboard")}</button>
          <button className="btn btn-ghost w-fit">{t("nav.dashboard")}</button>
          <button className="btn btn-info w-fit">{t("nav.dashboard")}</button>
          <button className="btn btn-link w-fit">{t("nav.dashboard")}</button>
        </div>
      </div>
    </div>
  );
}
