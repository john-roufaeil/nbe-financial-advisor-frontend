import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { useRequestPasswordReset } from "@/queries/auth";

/**
 * "Forgot password?" flow. The backend always responds 202 regardless of
 * whether the email exists (no enumeration), so this always shows the same
 * "check your inbox" confirmation once submitted.
 */
export const ForgotPasswordModal = forwardRef<HTMLDialogElement>(
  function ForgotPasswordModal(_props, ref) {
    const { t } = useTranslation();
    const requestReset = useRequestPasswordReset();
    const [sent, setSent] = useState(false);

    const schema = z.object({
      email: z.string().email({ message: t("signIn.errors.emailInvalid") }),
    });
    type Values = z.infer<typeof schema>;

    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<Values>({ resolver: zodResolver(schema) });

    async function onSubmit(values: Values) {
      await requestReset.mutateAsync({ email: values.email });
      setSent(true);
    }

    function handleClose() {
      setSent(false);
      reset();
    }

    return (
      <BaseModal ref={ref} onClose={handleClose} title={t("forgotPassword.title")}>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Mail className="text-primary size-10" />
            <p className="text-base-content/70 text-sm">
              {t("forgotPassword.sentMessage")}
            </p>
          </div>
        ) : (
          <form
            id="forgot-password-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <p className="text-base-content/60 text-sm">
              {t("forgotPassword.description")}
            </p>
            <label className="flex flex-col gap-1">
              <span className="label-text">{t("signIn.email")}</span>
              <input
                type="email"
                placeholder={t("signIn.email")}
                className="input input-bordered w-full"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </label>
            {errors.email && (
              <span role="alert" className="text-error text-sm">
                {errors.email.message}
              </span>
            )}
            <Button
              type="submit"
              className="btn btn-primary mt-2"
              loading={requestReset.isPending}
            >
              {t("forgotPassword.submit")}
            </Button>
          </form>
        )}
      </BaseModal>
    );
  },
);
