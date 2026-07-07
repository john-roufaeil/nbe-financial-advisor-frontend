import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/** Sets `document.title` to "{title} {app.bank}", reactive to the active i18n language. */
export function usePageTitle(title: string) {
  const { t } = useTranslation();
  const bank = t("app.bank");
  useEffect(() => {
    document.title = `${title} ${bank}`;
  }, [title, bank]);
}
