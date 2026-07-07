import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { usePageTitle } from "@/lib/use-page-title";

export default function Consent() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  usePageTitle(t("consent.title"));
  const begin = useOnboardingStore((s) => s.begin);

  function handleContinue() {
    begin();
    navigate(`/${lang}/onboarding`);
  }

  return (
    <div className="bg-base-200 flex min-h-screen items-center justify-center p-6">
      <div className="absolute inset-e-4 top-4 w-28">
        <LanguageSwitcher />
      </div>
      <div className="card bg-base-100 w-full max-w-md shadow-sm">
        <div className="card-body gap-4">
          <img
            src="/logo.webp"
            alt={t("app.name")}
            className="mx-auto mb-8 h-fit w-1/2"
          />
          <h1 className="card-title">{t("consent.title")}</h1>
          <p className="text-base-content/70 text-sm">{t("consent.body")}</p>
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>{t("consent.checkbox")}</span>
          </label>
          <button className="btn btn-primary" disabled={!agreed} onClick={handleContinue}>
            {t("actions.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
