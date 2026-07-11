import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, useLocation, Link } from "react-router";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { Button } from "@/components/shared/Button";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { usePageTitle } from "@/lib/use-page-title";
import { useLogin } from "@/queries/auth";

const signInSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
type SignInValues = z.infer<typeof signInSchema>;

export default function SignIn() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  // Set by RequireAuth when it turned a deep link away.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  usePageTitle(t("signIn.title"));
  const login = useAuthStore((s) => s.login);
  const begin = useOnboardingStore((s) => s.begin);
  const loginMutation = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(values: SignInValues) {
    try {
      await loginMutation.mutateAsync(values);
      login();
      navigate(from ?? `/${lang}/dashboard`, { replace: true });
    } catch {
      // loginMutation.onError already surfaced a toast; stay on page.
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
          to={`/${lang}`}
          className="btn btn-ghost text-base-content/60 flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          {t("actions.back")}
        </Link>
        <h1 className="text-2xl font-semibold">{t("signIn.title")}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder={t("signIn.email")}
            className="input input-bordered w-full"
            {...register("email")}
          />
          {errors.email && (
            <span className="text-error text-sm">{errors.email.message}</span>
          )}
          <PasswordInput
            placeholder={t("signIn.password")}
            className="input input-bordered w-full"
            {...register("password")}
          />
          {errors.password && (
            <span className="text-error text-sm">{errors.password.message}</span>
          )}
          <Button
            type="submit"
            className="btn btn-primary mt-2"
            loading={loginMutation.isPending}
          >
            {t("signIn.submit")}
          </Button>
        </form>
        <Link
          to={`/${lang}/onboarding`}
          onClick={() => begin()}
          className="btn btn-ghost underline underline-offset-2"
        >
          {t("signIn.getStarted")}
        </Link>
      </div>
    </AuthLayout>
  );
}
