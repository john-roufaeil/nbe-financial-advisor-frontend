import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useNavigate, useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/use-auth-store";
import { usePageTitle } from "@/lib/use-page-title";
import { useLogin } from "@/queries/auth";

const signInSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
type SignInValues = z.infer<typeof signInSchema>;

export default function SignIn() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t("signIn.title"));
  const login = useAuthStore((s) => s.login);
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
      navigate(`/${lang}/dashboard`);
    } catch {
      // loginMutation.onError already surfaced a toast; stay on page.
    }
  }

  return (
    <div className="bg-base-200 flex min-h-screen items-center justify-center p-6">
      <div className="absolute inset-e-4 top-4 w-28">
        <LanguageSwitcher />
      </div>

      <div className="card bg-base-100 w-full max-w-sm shadow-sm">
        <div className="card-body gap-3">
          <img
            src="/logo.webp"
            alt={t("app.name")}
            className="mx-auto mb-8 h-fit w-1/2"
          />
          <h1 className="card-title">{t("signIn.title")}</h1>
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
            <input
              type="password"
              placeholder={t("signIn.password")}
              className="input input-bordered w-full"
              {...register("password")}
            />
            {errors.password && (
              <span className="text-error text-sm">{errors.password.message}</span>
            )}
            <button
              type="submit"
              className="btn btn-primary mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                t("signIn.submit")
              )}
            </button>
          </form>
          <Link
            to={`/${lang}/consent`}
            className="btn btn-ghost underline underline-offset-2"
          >
            {t("signIn.getStarted")}
          </Link>
        </div>
      </div>
    </div>
  );
}
