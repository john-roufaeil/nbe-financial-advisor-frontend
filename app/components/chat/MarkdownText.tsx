import { memo } from "react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";

// Slotted in as the `Text` part renderer for assistant messages (see
// AssistantMessage in ChatMessages.tsx) — the advisor's replies are markdown
// (headings, lists, tables, bold figures), previously dumped to the DOM as a
// raw string. remarkGfm adds table/strikethrough support, since the analysis
// agent's grounded summaries are prone to reaching for tables. Styling lives
// in app.css under `.md-content`, themed off the same --color-* tokens as
// everything else so it tracks light/dark for free. Memoized per assistant-ui's
// own convention, since this component takes no dynamic props of its own —
// it reads the current text part from ambient context.
export const MarkdownText = memo(function MarkdownText() {
  return <MarkdownTextPrimitive remarkPlugins={[remarkGfm]} className="md-content" />;
});
