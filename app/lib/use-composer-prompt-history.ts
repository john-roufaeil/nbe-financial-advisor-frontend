import { useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useComposer, useComposerRuntime } from "@assistant-ui/react";
import { useMessages } from "@/queries/chat";
import { useChatStore } from "@/store/use-chat-store";

/**
 * Shell-style history: ArrowUp/ArrowDown cycle through the user's own past
 * messages in the current conversation, newest first. Only engages when the
 * caret sits on the input's first line (ArrowUp) or last line (ArrowDown) —
 * everywhere else the arrow key keeps its normal job of moving the caret
 * between lines of a multi-line draft.
 */
export function useComposerPromptHistory() {
  const conversationId = useChatStore((s) => s.currentConversationId);
  const { data: messages } = useMessages(conversationId);
  const text = useComposer((c) => c.text);
  const composerRuntime = useComposerRuntime();

  const history = useMemo(
    () =>
      messages
        ? messages
            .filter((m) => m.role === "user")
            .map((m) => m.text)
            .reverse()
        : [],
    [messages],
  );

  // -1 = not browsing history (composer holds the user's own live draft).
  const indexRef = useRef(-1);
  const draftRef = useRef("");

  // A sent message, a conversation switch, or the user clearing the box by
  // hand should all drop back to "not browsing" — empty text is the one
  // state that's unambiguous regardless of *why* it emptied.
  useEffect(() => {
    if (text === "") {
      indexRef.current = -1;
      draftRef.current = "";
    }
  }, [text]);

  useEffect(() => {
    indexRef.current = -1;
    draftRef.current = "";
  }, [conversationId]);

  function moveCaretToEnd(el: HTMLTextAreaElement) {
    requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
  }

  return function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const el = e.currentTarget;

    if (e.key === "ArrowUp") {
      const onFirstLine = !el.value.slice(0, el.selectionStart ?? 0).includes("\n");
      if (!onFirstLine || history.length === 0 || indexRef.current >= history.length - 1)
        return;
      if (indexRef.current === -1) draftRef.current = text;
      indexRef.current += 1;
      e.preventDefault();
      composerRuntime.setText(history[indexRef.current]);
      moveCaretToEnd(el);
      return;
    }

    const onLastLine = !el.value.slice(el.selectionEnd ?? el.value.length).includes("\n");
    if (!onLastLine || indexRef.current === -1) return;
    e.preventDefault();
    indexRef.current -= 1;
    composerRuntime.setText(
      indexRef.current === -1 ? draftRef.current : history[indexRef.current],
    );
    moveCaretToEnd(el);
  };
}
