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
import { restoreCapturedComposerText } from "@/lib/composer-text-recovery";

/**
 * Uploading a document in chat is a shortcut into the same bank-statement
 * ingestion pipeline `POST /statements` uses (same 202-and-poll contract) —
 * the upload itself lands as an assistant message referencing the new
 * statement, so `send()` uploads immediately and invalidates the
 * conversation's messages (plus the statements/ledger queries the pipeline
 * restates) rather than attaching the file to the next outgoing message.
 */
function createDocumentAdapter(
  getConversationId: () => Promise<string>,
  source: DataSource,
  queryClient: QueryClient,
): AttachmentAdapter {
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
      const conversationId = await getConversationId();
      try {
        await impl(source).uploadChatAttachment(conversationId, attachment.file);
      } catch (error) {
        toastApiError(error);
        restoreCapturedComposerText();
        throw error;
      }

      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId, source),
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.bankStatements] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.transactions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });

      return {
        id: attachment.id,
        type: "document",
        name: attachment.name,
        content: [
          {
            type: "text",
            text: `[Uploaded "${attachment.name}" — see the chat reply and Bank Statements for processing status.]`,
          },
        ],
        status: { type: "complete" },
      };
    },
    async remove() {},
  };
}

/**
 * `getConversationId` is a callback (not a plain id) because an attachment
 * can be the very first thing a user sends into a brand-new thread — the
 * conversation may not exist yet, so the adapter creates it on demand at
 * send-time via the caller's ensure-conversation logic.
 */
export function createChatAttachmentsAdapter(
  getConversationId: () => Promise<string>,
  source: DataSource,
  queryClient: QueryClient,
) {
  return new CompositeAttachmentAdapter([
    new SimpleImageAttachmentAdapter(),
    createDocumentAdapter(getConversationId, source, queryClient),
  ]);
}
