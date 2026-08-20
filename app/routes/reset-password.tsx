import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/shared/layout/AuthLayout";
import { Button } from "@/components/shared/Button";
import { PasswordInput } from "@/components/shared/forms/PasswordInput";
import { GoHomeOrSignInLink } from "@/components/auth/GoHomeOrSignInLink";
import { usePageTitle } from "@/lib/use-page-title";
import { useSyncHtmlDir } from "@/lib/use-sync-html-dir";
import { useCanGoBack } from "@/lib/use-can-go-back";
import { useConfirmPasswordReset } from "@/queries/auth";
import { isRateLimitError } from "@/lib/toast";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

const REDIRECT_SECONDS = 5;

/**
 * Landing page for the password-reset email link
 * (`{FRONTEND_URL}/reset-password?t=<opaque ticket>`), unprefixed because
 * the backend has no locale context when composing it. `t` is a single-use
 * opaque ticket, not the raw user id/token — the backend resolves it
 * server-side.
 */
export default function ResetPassword() {
  const { t, i18n } = useTranslation();
  usePageTitle(t("resetPassword.title"));
  useSyncHtmlDir();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const [searchParams] = useSearchParams();
  const confirmMutation = useConfirmPasswordReset();
  const [status, setStatus] = useState<"form" | "success" | "invalid" | "rateLimited">(
    "form",
  );
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const ticket = searchParams.get("t");

  // This page is unprefixed (no :lang in the URL — see module docstring), so
  // the redirect target reads the active i18n language, same as
  // GoHomeOrSignInLink. Resetting a password is a deliberate "sign in fresh
  // with the new one" signal, so this always targets sign-in, unlike that
  // link's home-if-already-signed-in branch.
  useEffect(() => {
    if (status !== "success") return;
    setSecondsLeft(REDIRECT_SECONDS);
    const lang = SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
      ? (i18n.language as SupportedLanguage)
      : DEFAULT_LANGUAGE;
    const interval = setInterval(() => {
      setSecondsLeft((seconds) => seconds - 1);
    }, 1000);
    const timeout = setTimeout(() => {
      navigate(localizedPath(lang, ROUTE_SEGMENTS.signIn), { replace: true });
    }, REDIRECT_SECONDS * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, i18n.language, navigate]);

  const schema = z
    .object({
      password: z.string().min(8, t("resetPassword.errors.passwordTooShort")),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t("resetPassword.errors.passwordsDontMatch"),
      path: ["confirmPassword"],
    });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    if (!ticket) {
      setStatus("invalid");
      return;
    }
    try {
      await confirmMutation.mutateAsync({
        t: ticket,
        new_password: values.password,
      });
      setStatus("success");
    } catch (error) {
      // A rate-limit (SEC-004) is transient — the link itself is still
      // valid, so this must not tell the user to request a new one.
      setStatus(isRateLimitError(error) ? "rateLimited" : "invalid");
    }
  }

  if (!ticket) {
    return (
      <AuthLayout>
        <InvalidState
          icon={<XCircle className="text-error size-12" />}
          title={t("resetPassword.invalidTitle")}
          message={t("resetPassword.invalidMessage")}
          onBack={() => navigate(-1)}
          canGoBack={canGoBack}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {status === "success" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="text-success size-12" />
          <h1 className="text-xl font-semibold">{t("resetPassword.successTitle")}</h1>
          <p className="text-base-content/70">{t("resetPassword.successMessage")}</p>
          <p className="text-base-content/50 text-sm" role="status">
            {t("resetPassword.redirecting", { seconds: Math.max(0, secondsLeft) })}
          </p>
          <GoHomeOrSignInLink className="btn btn-primary" />
        </div>
      )}
      {status === "invalid" && (
        <InvalidState
          icon={<XCircle className="text-error size-12" />}
          title={t("resetPassword.invalidTitle")}
          message={t("resetPassword.invalidMessage")}
          onBack={() => navigate(-1)}
          canGoBack={canGoBack}
        />
      )}
      {status === "rateLimited" && (
        <InvalidState
          icon={<Clock className="text-warning size-12" />}
          title={t("resetPassword.rateLimitedTitle")}
          message={t("resetPassword.rateLimitedMessage")}
          onBack={() => navigate(-1)}
          canGoBack={canGoBack}
        />
      )}
      {status === "form" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">{t("resetPassword.title")}</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="label-text">{t("resetPassword.newPassword")}</span>
              <PasswordInput
                id="reset-password"
                placeholder={t("resetPassword.newPassword")}
                className="input input-bordered w-full"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "reset-password-error" : undefined}
                {...register("password")}
              />
            </label>
            {errors.password && (
              <span id="reset-password-error" role="alert" className="text-error text-sm">
                {errors.password.message}
              </span>
            )}
            <label className="flex flex-col gap-1">
              <span className="label-text">{t("resetPassword.confirmPassword")}</span>
              <PasswordInput
                id="reset-password-confirm"
                placeholder={t("resetPassword.confirmPassword")}
                className="input input-bordered w-full"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "reset-password-confirm-error" : undefined
                }
                {...register("confirmPassword")}
              />
            </label>
            {errors.confirmPassword && (
              <span
                id="reset-password-confirm-error"
                role="alert"
                className="text-error text-sm"
              >
                {errors.confirmPassword.message}
              </span>
            )}
            <Button
              type="submit"
              className="btn btn-primary mt-2"
              loading={confirmMutation.isPending}
            >
              {t("resetPassword.submit")}
            </Button>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}

function InvalidState({
  icon,
  title,
  message,
  onBack,
  canGoBack,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  onBack: () => void;
  canGoBack: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {icon}
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-base-content/70">{message}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="btn btn-ghost bg-base-200"
        >
          {t("resetPassword.goBack")}
        </button>
        <GoHomeOrSignInLink className="btn btn-primary" />
      </div>
    </div>
  );
}
