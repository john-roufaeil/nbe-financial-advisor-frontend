import {
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  type AttachmentAdapter,
  type PendingAttachment,
  type CompleteAttachment,
} from "@assistant-ui/react";
import type { QueryClient } from "@tanstack/react-query";
import { chatApi, chatKeys } from "@/queries/chat";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastApiError } from "@/lib/toast";

/**
 * Files picked in the composer, keyed by attachment id, waiting to be uploaded.
 *
 * The adapter's send() only STASHES the file here; the actual upload happens in
 * the runtime's onNew (via sendPendingChatAttachments) — the one place that also
 * has the caption text, for BOTH Enter and send-button submits. (The composer
 * only snapshots typed text on the button's onClick, so an Enter-send never
 * captured it — hence uploading from send() dropped the caption and fell back to
 * the file name.) Uploading from onNew instead lets the caption ride on the same
 * request as its message, with no separate racing send.
 */
const pendingUploadFiles = new Map<string, File>();

/**
 * Uploading a document in chat is a shortcut into the same bank-statement
 * ingestion pipeline `POST /statements` uses (same 202 contract, resolved via
 * SSE — see api/chat.ts's uploadChatAttachment) — the upload lands as an
 * assistant message referencing the new statement.
 */
function createDocumentAdapter(): AttachmentAdapter {
  return {
    accept:
      ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    async add({ file }): Promise<PendingAttachment> {
      return {
        id: crypto.randomUUID(),
        type: "document",
        name: file.name,
        file,
        status: { type: "requires-action", reason: "composer-send" },
      };
    },
    async send(attachment): Promise<CompleteAttachment> {
      // Defer the upload to onNew (which has the caption); just hand off the file.
      pendingUploadFiles.set(attachment.id, attachment.file);
      return {
        id: attachment.id,
        type: "document",
        name: attachment.name,
        content: [{ type: "text", text: `[Uploaded "${attachment.name}"]` }],
        status: { type: "complete" },
      };
    },
    async remove() {},
  };
}

export function createChatAttachmentsAdapter() {
  return new CompositeAttachmentAdapter([
    new SimpleImageAttachmentAdapter(),
    createDocumentAdapter(),
  ]);
}

/**
 * Uploads the files the adapter stashed for this send, then refreshes the
 * conversation plus the statements/ledger/dashboard the pipeline restates.
 * Called from onNew, so the caption is available for every send path (Enter
 * and button alike).
 *
 * Each upload call becomes its own backend message, so `caption` only rides
 * on the FIRST attachment — reusing it on every call would duplicate the
 * same caption into a separate message per attachment (the backend falls
 * back to the file name for the rest, same as an uncaptioned upload).
 *
 * Uploads run independently: one failing doesn't stop the others from being
 * attempted, a file is only dropped from the pending map once ITS upload
 * actually succeeds (so a failure stays retryable instead of being silently
 * lost), and the cache is refreshed for whatever did succeed even if
 * something else in the same send failed.
 */
export async function sendPendingChatAttachments(
  conversationId: string,
  caption: string,
  attachmentIds: string[],
  queryClient: QueryClient,
): Promise<void> {
  let uploadedCount = 0;
  let failedCount = 0;

  for (const [index, id] of attachmentIds.entries()) {
    const file = pendingUploadFiles.get(id);
    if (!file) continue;
    try {
      await chatApi.uploadChatAttachment(
        conversationId,
        file,
        index === 0 ? caption : undefined,
      );
      pendingUploadFiles.delete(id);
      uploadedCount++;
    } catch {
      failedCount++;
    }
  }

  if (uploadedCount > 0) {
    queryClient.invalidateQueries({
      queryKey: chatKeys.messages(conversationId),
    });
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.bankStatements] });
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.transactions] });
    queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
  }

  if (failedCount > 0) {
    const error = new Error(`${failedCount} attachment(s) failed to upload`);
    toastApiError(error);
    throw error;
  }
}
