import { Navigate } from "react-router";
import { DEFAULT_LANGUAGE } from "@/i18n";

export default function RootRedirect() {
  return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
}
