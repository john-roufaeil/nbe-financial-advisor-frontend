import { Navigate } from "react-router";
import { DEFAULT_LANGUAGE } from "./lang-layout";

export default function RootRedirect() {
  return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
}