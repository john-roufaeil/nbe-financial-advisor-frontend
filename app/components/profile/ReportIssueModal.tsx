import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { closeDialog } from "@/lib/close-dialog";
import { useCreateIssue } from "@/queries/issues";

interface FormValues {
  description: string;
}

export const ReportIssueModal = forwardRef<HTMLDialogElement>(
  function ReportIssueModal(_props, ref) {
    const { t } = useTranslation();
    const createIssue = useCreateIssue();

    const schema = z.object({
      description: z.string().trim().min(10, t("settings.issues.errors.tooShort")),
    });

    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    async function onSubmit(values: FormValues) {
      await createIssue.mutateAsync(values.description);
      reset();
      closeDialog(ref);
    }

    return (
      <BaseModal ref={ref} onClose={reset} title={t("settings.issues.reportTitle")}>
        <form
          id="report-issue-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <p className="text-base-content/60 text-sm">
            {t("settings.issues.reportDescription")}
          </p>
          <label className="flex flex-col gap-1">
            <span className="label-text">{t("settings.issues.fields.description")}</span>
            <textarea
              rows={4}
              className="textarea textarea-bordered w-full"
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? "issue-description-error" : undefined
              }
              {...register("description")}
            />
          </label>
          {errors.description && (
            <span
              id="issue-description-error"
              role="alert"
              className="text-error text-sm"
            >
              {errors.description.message}
            </span>
          )}
          <Button
            type="submit"
            className="btn btn-primary mt-2"
            loading={createIssue.isPending}
          >
            {t("settings.issues.submit")}
          </Button>
        </form>
      </BaseModal>
    );
  },
);
