import {
  ThreadListPrimitive,
  ThreadListItemPrimitive,
  useThreadListItem,
} from "@assistant-ui/react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";

function ThreadListItem() {
  const { t } = useTranslation();
  const title = useThreadListItem((item) => item.title);
  const titleText = title ?? t("chat.newChat");

  return (
    <ThreadListItemPrimitive.Root className="group/item hover:bg-base-300 data-[active]:bg-primary/10 data-[active]:hover:bg-primary/15 relative flex items-center gap-1 rounded-md text-sm transition-colors">
      <span className="bg-primary my-1 h-5 w-1 shrink-0 rounded-full opacity-0 transition-opacity group-data-[active]/item:opacity-100" />
      <ThreadListItemPrimitive.Trigger className="focus-visible:outline-primary/50 flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 pe-2.5 text-start focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2">
        <MessageSquare className="text-base-content/50 group-data-[active]/item:text-primary size-4 shrink-0" />
        <Tooltip content={titleText} position="top" className="min-w-0 flex-1">
          <span className="group-data-[active]/item:text-primary block truncate group-data-[active]/item:font-medium">
            <ThreadListItemPrimitive.Title fallback="New chat" />
          </span>
        </Tooltip>
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemPrimitive.Delete className="btn btn-ghost btn-xs btn-square me-1 opacity-0 transition-opacity group-focus-within/item:opacity-100 group-hover/item:opacity-100 focus-visible:opacity-100">
        <Trash2 className="size-3.5" />
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemPrimitive.Root>
  );
}

export function ChatThreadList() {
  const { t } = useTranslation();
  return (
    <ThreadListPrimitive.Root className="flex min-h-0 flex-1 flex-col gap-1">
      <ThreadListPrimitive.New asChild>
        <button className="btn btn-ghost btn-sm w-full justify-start gap-2">
          <Plus className="size-4" /> {t("chat.newChat")}
        </button>
      </ThreadListPrimitive.New>
      <p className="text-base-content/40 px-2.5 pt-3 pb-1 text-xs font-medium tracking-wide uppercase">
        {t("chat.recent")}
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        <ThreadListPrimitive.Items components={{ ThreadListItem }} />
      </div>
    </ThreadListPrimitive.Root>
  );
}
