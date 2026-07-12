import { useEffect, useState, type RefObject } from "react";
import { MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/use-chat-store";

const MAX_VISIBLE = 5;

function scrollToMessage(id: string) {
  document
    .getElementById(`msg-${id}`)
    ?.scrollIntoView({ behavior: "smooth", block: "end" });
}

export function QuestionsNav({
  viewportRef,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();
  const store = useChatStore();
  const thread = store.threads[store.currentThreadId];
  const allQuestions = (thread?.messages ?? []).filter((m) => m.role === "user");
  const hiddenCount = Math.max(0, allQuestions.length - MAX_VISIBLE);
  const questions = allQuestions.slice(-MAX_VISIBLE);
  const questionIds = questions.map((q) => q.id).join(",");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !questionIds) return;

    const ids = questionIds.split(",");
    let frame = 0;

    const updateActive = () => {
      frame = 0;
      const viewportBottom = viewport.getBoundingClientRect().bottom;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(`msg-${id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= viewportBottom) current = id;
        else break;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateActive);
    };

    updateActive();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [viewportRef, questionIds]);

  if (allQuestions.length < 2) return null;

  return (
    <nav
      aria-label={t("chat.nav.questions")}
      className="border-base-300 bg-base-100/90 absolute inset-e-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-2.5 rounded-full border px-1.5 py-2.5 shadow-sm backdrop-blur sm:flex"
    >
      {hiddenCount > 0 && (
        <div className="group/dot relative flex shrink-0 cursor-default items-center justify-center rounded-full p-1.5">
          <MoreVertical className="text-base-content/30 size-3.5" />
          <div className="border-base-300 bg-base-100 text-base-content pointer-events-none absolute inset-e-full top-1/2 me-3 -translate-y-1/2 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover/dot:opacity-100">
            {t("chat.nav.moreQuestions", { count: hiddenCount })}
          </div>
        </div>
      )}
      {questions.map((q, i) => {
        const isActive = q.id === activeId;
        return (
          <div
            key={q.id}
            className="group/dot relative flex shrink-0 items-center justify-center"
          >
            <button
              type="button"
              aria-label={q.text}
              aria-current={isActive}
              onClick={() => scrollToMessage(q.id)}
              className="hover:bg-base-300 focus-visible:outline-primary/50 flex cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span
                className={`size-2 rounded-full transition-all group-hover/dot:scale-125 ${
                  isActive
                    ? "bg-success group-hover/dot:bg-success scale-125"
                    : "bg-base-300 group-hover/dot:bg-primary"
                }`}
              />
              <span className="sr-only">{i + 1}</span>
            </button>
            <div className="border-base-300 bg-base-100 text-base-content pointer-events-none absolute inset-e-full top-1/2 me-3 max-w-56 -translate-y-1/2 truncate rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover/dot:opacity-100">
              {q.text}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
