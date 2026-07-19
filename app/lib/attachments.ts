import {
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  type AttachmentAdapter,
  type PendingAttachment,
  type CompleteAttachment,
} from "@assistant-ui/react";
import type { QueryClient } from "@tanstack/react-query";
import { impl, chatKeys } from "@/queries/chat";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import type { DataSource } from "@/store/use-data-source-store";
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
 * ingestion pipeline `POST /statements` uses (same 202-and-poll contract) — the
 * upload lands as an assistant message referencing the new statement.
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
 * Uploads the files the adapter stashed for this send, attaching `caption` as
 * the user's own message (the backend falls back to the file name when it is
 * blank), then refreshes the conversation plus the statements/ledger/dashboard
 * the pipeline restates. Called from onNew, so the caption is available for
 * every send path (Enter and button alike).
 */
export async function sendPendingChatAttachments(
  conversationId: string,
  caption: string,
  attachmentIds: string[],
  source: DataSource,
  queryClient: QueryClient,
): Promise<void> {
  try {
    for (const id of attachmentIds) {
      const file = pendingUploadFiles.get(id);
      pendingUploadFiles.delete(id);
      if (file) await impl(source).uploadChatAttachment(conversationId, file, caption);
    }
  } catch (error) {
    toastApiError(error);
    throw error;
  }

  queryClient.invalidateQueries({
    queryKey: chatKeys.messages(conversationId, source),
  });
  queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.bankStatements] });
  queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.transactions] });
  queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
}
