import type { RefObject } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";

export function ChatScrollButtons({
  viewportRef,
  atTop,
  atBottom,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  atTop: boolean;
  atBottom: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-e-6 bottom-3 z-10 flex flex-col gap-2">
      <Tooltip content={t("chat.nav.top")} position="start">
        <button
          type="button"
          disabled={atTop}
          onClick={() => viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="btn btn-circle btn-sm border-base-300 bg-base-100 border shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          aria-label={t("chat.nav.top")}
        >
          <ChevronUp data-no-flip className="size-4" />
        </button>
      </Tooltip>
      <Tooltip content={t("chat.nav.bottom")} position="start">
        <button
          type="button"
          disabled={atBottom}
          onClick={() => {
            const el = viewportRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
          className="btn btn-circle btn-sm border-base-300 bg-base-100 border shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          aria-label={t("chat.nav.bottom")}
        >
          <ChevronDown data-no-flip className="size-4" />
        </button>
      </Tooltip>
    </div>
  );
}
