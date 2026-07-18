import { useEffect, useRef, useState } from "react";
import { useMessage } from "@assistant-ui/react";
import { Star, MessageSquareText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMessageFeedbackStore } from "@/store/use-message-feedback-store";
import { useSubmitFeedback } from "@/queries/feedback";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Tooltip } from "@/components/shared/Tooltip";
import { closeDialog } from "@/lib/close-dialog";

function StarPicker({
  value,
  onChange,
  readOnly,
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={String(n)}
          aria-pressed={n <= value}
          className={`btn btn-ghost btn-xs btn-square ${readOnly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            data-no-flip
            className={`size-5 ${n <= value ? "fill-warning text-warning" : "text-base-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Trigger + modal for leaving feedback on an assistant message: a 1-5 star
 * rating and/or a comment (at least one required, per POST /feedback/).
 * Once submitted, feedback is add-only — the modal switches to a read-only
 * view of what was sent, with no edit or delete.
 */
export function ChatFeedbackButton() {
  const { t } = useTranslation();
  const messageId = useMessage((m) => m.id);
  const existing = useMessageFeedbackStore((s) => s.byMessageId[messageId]);
  const setFeedback = useMessageFeedbackStore((s) => s.setFeedback);
  const submitFeedback = useSubmitFeedback();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    setRating(existing?.rating ?? 0);
    setComment(existing?.comment ?? "");
  }, [existing]);

  const hasFeedback = !!existing;
  const canSubmit = rating > 0 || comment.trim().length > 0;
  const label = hasFeedback ? t("chat.feedback.view") : t("chat.feedback.give");

  function handleSubmit() {
    const body = {
      ...(rating > 0 ? { rating } : {}),
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    };
    submitFeedback.mutate(
      { targetType: "message", targetId: messageId, ...body },
      {
        onSuccess: () => {
          setFeedback(messageId, body);
          closeDialog(modalRef);
        },
      },
    );
  }

  return (
    <>
      <Tooltip content={label}>
        <button
          type="button"
          onClick={() => modalRef.current?.showModal()}
          aria-label={label}
          className={`btn btn-ghost btn-xs btn-square ${hasFeedback ? "text-warning" : ""}`}
        >
          {hasFeedback ? (
            <Star data-no-flip className="size-3.5 fill-current" />
          ) : (
            <MessageSquareText className="size-3.5" />
          )}
        </button>
      </Tooltip>

      <BaseModal
        ref={modalRef}
        title={label}
        actions={
          !hasFeedback && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitFeedback.isPending}
              className="btn btn-primary btn-sm"
            >
              {t("chat.feedback.submit")}
            </button>
          )
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-base-content/70 text-xs font-medium">
              {t("chat.feedback.rating")}
            </span>
            <StarPicker value={rating} onChange={setRating} readOnly={hasFeedback} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-base-content/70 text-xs font-medium">
              {t("chat.feedback.comment")}
            </span>
            {hasFeedback ? (
              <p className="text-sm wrap-anywhere whitespace-pre-wrap">
                {comment || t("chat.feedback.noComment")}
              </p>
            ) : (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={t("chat.feedback.commentPlaceholder")}
                className="textarea textarea-bordered w-full text-sm"
              />
            )}
          </div>
        </div>
      </BaseModal>
    </>
  );
}
