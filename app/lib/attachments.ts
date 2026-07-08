import {
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  type AttachmentAdapter,
  type PendingAttachment,
  type CompleteAttachment,
} from "@assistant-ui/react";

const documentAdapter: AttachmentAdapter = {
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
    return {
      id: attachment.id,
      type: "document",
      name: attachment.name,
      content: [
        {
          type: "text",
          text: `[Attached document: ${attachment.name} — no backend connected yet to parse it.]`,
        },
      ],
      status: { type: "complete" },
    };
  },
  async remove() {},
};

export const chatAttachmentsAdapter = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  documentAdapter,
]);
