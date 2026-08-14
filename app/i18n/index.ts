import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enApp from "./locales/en/app.json";
import enNav from "./locales/en/nav.json";
import enActions from "./locales/en/actions.json";
import enStatus from "./locales/en/status.json";
import enConfirm from "./locales/en/confirm.json";
import enToast from "./locales/en/toast.json";
import enFinance from "./locales/en/finance.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enChat from "./locales/en/chat.json";
import enTransactions from "./locales/en/transactions.json";
import enBankStatements from "./locales/en/bankStatements.json";
import enShared from "./locales/en/common.json";
import enSettings from "./locales/en/settings.json";
import enNotFound from "./locales/en/notFound.json";
import enAdmin from "./locales/en/admin.json";
import enBankConnections from "./locales/en/bankConnections.json";
import enAnomalies from "./locales/en/anomalies.json";
import enBudget from "./locales/en/budget.json";

import arApp from "./locales/ar/app.json";
import arNav from "./locales/ar/nav.json";
import arActions from "./locales/ar/actions.json";
import arStatus from "./locales/ar/status.json";
import arConfirm from "./locales/ar/confirm.json";
import arToast from "./locales/ar/toast.json";
import arFinance from "./locales/ar/finance.json";
import arAuth from "./locales/ar/auth.json";
import arDashboard from "./locales/ar/dashboard.json";
import arChat from "./locales/ar/chat.json";
import arTransactions from "./locales/ar/transactions.json";
import arBankStatements from "./locales/ar/bankStatements.json";
import arShared from "./locales/ar/common.json";
import arSettings from "./locales/ar/settings.json";
import arNotFound from "./locales/ar/notFound.json";
import arAdmin from "./locales/ar/admin.json";
import arBankConnections from "./locales/ar/bankConnections.json";
import arAnomalies from "./locales/ar/anomalies.json";
import arBudget from "./locales/ar/budget.json";

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
export const RTL_LANGUAGES: SupportedLanguage[] = ["ar"];

/**
 * Source translations live split across one file per domain (app/i18n/locales/<lang>/*.json)
 * for maintainability, but are merged into a single "common" namespace here so every
 * existing unprefixed translate-function call keeps resolving the same as before.
 */
const enCommon = {
  ...enApp,
  ...enNav,
  ...enActions,
  ...enStatus,
  ...enConfirm,
  ...enToast,
  ...enFinance,
  ...enAuth,
  ...enDashboard,
  ...enChat,
  ...enTransactions,
  ...enBankStatements,
  ...enShared,
  ...enSettings,
  ...enNotFound,
  ...enAdmin,
  ...enBankConnections,
  ...enAnomalies,
  ...enBudget,
};

const arCommon = {
  ...arApp,
  ...arNav,
  ...arActions,
  ...arStatus,
  ...arConfirm,
  ...arToast,
  ...arFinance,
  ...arAuth,
  ...arDashboard,
  ...arChat,
  ...arTransactions,
  ...arBankStatements,
  ...arShared,
  ...arSettings,
  ...arNotFound,
  ...arAdmin,
  ...arBankConnections,
  ...arAnomalies,
  ...arBudget,
};

export const resources = {
  en: { common: enCommon },
  ar: { common: arCommon },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
    detection: {
      // The URL (:lang param) is the real source of truth — LangLayout
      // calls i18n.changeLanguage() directly. This detector config is just
      // a fallback for the very first load before that runs.
      order: ["path", "localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
