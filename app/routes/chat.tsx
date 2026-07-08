import { useTranslation } from "react-i18next";
import { ChatThread } from "@/components/chat/ChatThread";
import { usePageTitle } from "@/lib/use-page-title";

export default function Chat() {
  const { t } = useTranslation();
  usePageTitle(t("nav.chat"));
  return <ChatThread />;
}
