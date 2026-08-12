import { memo } from "react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";

// Renders assistant replies as markdown (advisor output often includes tables).
// remarkGfm adds table/strikethrough support; styling lives in app.css (.md-content).
// Memoized since it takes no props — it reads the current text part from ambient context.
export const MarkdownText = memo(function MarkdownText() {
  return <MarkdownTextPrimitive remarkPlugins={[remarkGfm]} className="md-content" />;
});
