/**
 * Bridges the composer's send button (which snapshots the typed text right
 * before assistant-ui clears the composer) and the attachments adapter
 * (which knows, asynchronously, whether the send actually failed) — the
 * assistant-ui composer core clears text/attachments optimistically and
 * doesn't propagate adapter rejections, so this is the only way to put the
 * user's message back after a failed upload.
 */
let restoreFn: ((text: string) => void) | null = null;
let pendingText = "";

export function registerComposerTextRestore(fn: ((text: string) => void) | null) {
  restoreFn = fn;
}

export function captureComposerTextForRestore(text: string) {
  pendingText = text;
}

export function restoreCapturedComposerText() {
  if (pendingText) restoreFn?.(pendingText);
  pendingText = "";
}
