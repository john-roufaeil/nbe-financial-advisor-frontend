import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/lib/use-page-title";
import { LoadingAnnouncement } from "@/components/shared/skeletons/LoadingAnnouncement";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

// Deferred: pulls in @assistant-ui/react plus the full tool-component
// registry, none of which is needed until the user actually opens Chat.
const ChatThread = lazy(() =>
  import("@/components/chat/ChatThread").then((m) => ({ default: m.ChatThread })),
);

export default function Chat() {
  const { t } = useTranslation();
  usePageTitle(t("nav.chat"));
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <LoadingAnnouncement />
            <span
              className="loading loading-spinner loading-lg text-primary"
              aria-hidden="true"
            />
          </div>
        }
      >
        <ChatThread />
      </Suspense>
    </ErrorBoundary>
  );
}
