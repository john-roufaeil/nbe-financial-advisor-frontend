import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, useLocation, Link } from "react-router";
import { AuthLayout } from "@/components/shared/layout/AuthLayout";
import { Button } from "@/components/shared/Button";
import { PasswordInput } from "@/components/shared/forms/PasswordInput";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Landmark, MailCheck } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { usePageTitle } from "@/lib/use-page-title";
import { useLogin, useBankLoginInitiate } from "@/queries/auth";
import { useCheckProfileCompletion } from "@/queries/profile";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import { useBankOAuthPopup } from "@/lib/use-bank-oauth-popup";

/** Slug of the (currently only) registered bank connector — see services/bank_connectors/mock_bank.py on the backend. */
const MOCK_BANK_PROVIDER_SLUG = "mock_bank";

export default function SignIn() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  // Set by RequireAuth when it turned a deep link away, by onboarding's last
  // step right after a successful signup, or by the account step's "email
  // already registered" link (AccountStep.tsx) so the typed email carries
  // over instead of being retyped.
  const locationState = location.state as {
    from?: { pathname: string };
    justSignedUp?: boolean;
    email?: string;
  } | null;
  const from = locationState?.from?.pathname;
  const justSignedUp = locationState?.justSignedUp === true;
  const prefillEmail = locationState?.email;
  usePageTitle(t("signIn.title"));
  const login = useAuthStore((s) => s.login);
  const setTokens = useAuthStore((s) => s.setTokens);
  const begin = useOnboardingStore((s) => s.begin);
  const loginMutation = useLogin();
  const bankLoginInitiate = useBankLoginInitiate();
  const checkProfileCompletion = useCheckProfileCompletion();
  const forgotPasswordRef = useRef<HTMLDialogElement>(null);

  // Handles the popup opened by onBankLogin, including why this can't just
  // be done from inside the popup itself (the access token has to land in
  // *this* tab's in-memory store) — see use-bank-oauth-popup.ts.
  const { openPopup } = useBankOAuthPopup("bank-login", (result) => {
    setTokens({ accessToken: result.accessToken });
    login();
    void checkProfileCompletion();
    navigate(from ?? localizedPath(lang!, ROUTE_SEGMENTS.dashboard), { replace: true });
  });

  const signInSchema = z.object({
    email: z.string().email({ message: t("signIn.errors.emailInvalid") }),
    password: z.string().min(1, t("signIn.errors.passwordRequired")),
  });
  type SignInValues = z.infer<typeof signInSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: prefillEmail ? { email: prefillEmail } : undefined,
  });

  async function onSubmit(values: SignInValues) {
    try {
      await loginMutation.mutateAsync(values);
      login();
      void checkProfileCompletion();
      navigate(from ?? localizedPath(lang!, ROUTE_SEGMENTS.dashboard), { replace: true });
    } catch {
      // loginMutation.onError already surfaced a toast; stay on page.
    }
  }

  async function onBankLogin() {
    try {
      const { authorize_url } = await bankLoginInitiate.mutateAsync({
        provider_slug: MOCK_BANK_PROVIDER_SLUG,
      });
      // Falls back to a full-tab redirect if the popup was blocked — still
      // works, just loses the in-memory-only access token on the way back
      // (bank-login-callback.tsx's no-opener branch handles that case).
      openPopup(authorize_url);
    } catch {
      // onError already surfaced a toast; stay on page.
    }
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-4">
        <img
          src="/logo.webp"
          alt={t("app.name")}
          className="mx-auto h-auto w-1/2 max-w-50"
        />
        <Link
          to={localizedPath(lang!)}
          className="btn btn-ghost text-base-content/60 flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          {t("actions.back")}
        </Link>
        <h1 className="text-2xl font-semibold">{t("signIn.title")}</h1>
        {justSignedUp && (
          <div className="alert alert-info items-start gap-3 text-sm sm:items-center">
            <MailCheck data-no-flip className="size-5 shrink-0" />
            <span>{t("signIn.justSignedUp")}</span>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="label-text">{t("signIn.email")}</span>
            <input
              type="email"
              id="signin-email"
              placeholder={t("signIn.email")}
              className="input input-bordered w-full"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "signin-email-error" : undefined}
              {...register("email")}
            />
          </label>
          {errors.email && (
            <span id="signin-email-error" role="alert" className="text-error text-sm">
              {errors.email.message}
            </span>
          )}
          <label className="flex flex-col gap-1">
            <span className="label-text">{t("signIn.password")}</span>
            <PasswordInput
              id="signin-password"
              placeholder={t("signIn.password")}
              className="input input-bordered w-full"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "signin-password-error" : undefined}
              {...register("password")}
            />
          </label>
          {errors.password && (
            <span id="signin-password-error" role="alert" className="text-error text-sm">
              {errors.password.message}
            </span>
          )}
          <button
            type="button"
            onClick={() => forgotPasswordRef.current?.showModal()}
            className="link link-hover text-base-content/60 self-end text-sm"
          >
            {t("signIn.forgotPassword")}
          </button>
          <Button
            type="submit"
            className="btn btn-primary mt-2"
            loading={loginMutation.isPending}
          >
            {t("signIn.submit")}
          </Button>
        </form>
        <div className="divider text-base-content/40 text-xs">{t("signIn.or")}</div>
        <Button
          type="button"
          onClick={onBankLogin}
          loading={bankLoginInitiate.isPending}
          className="btn btn-outline gap-2"
        >
          <Landmark className="size-4" />
          {t("signIn.bankLogin.action")}
        </Button>
        <Link
          to={localizedPath(lang!, ROUTE_SEGMENTS.onboarding)}
          onClick={() => begin()}
          className="btn btn-ghost underline underline-offset-2"
        >
          {t("signIn.getStarted")}
        </Link>
      </div>
      <ForgotPasswordModal ref={forgotPasswordRef} />
    </AuthLayout>
  );
}
