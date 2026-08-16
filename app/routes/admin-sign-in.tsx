import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { AdminAuthLayout } from "@/components/admin/AdminAuthLayout";
import { Button } from "@/components/shared/Button";
import { PasswordInput } from "@/components/shared/forms/PasswordInput";
import { RestoringScreen } from "@/components/shared/auth/RestoringScreen";
import { usePageTitle } from "@/lib/use-page-title";
import { useAdminLogin } from "@/queries/admin";
import { useAdminSessionGate } from "@/lib/use-admin-session-gate";
import { useAuthStore } from "@/store/use-auth-store";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import NotFound from "@/routes/not-found";

export default function AdminSignIn() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t("admin.signIn.title"));
  // SEC-009: restore-aware now that POST /admin/auth/refresh exists — a
  // reload no longer means re-entering credentials (see RequireAdmin).
  const { restoring, hasSession, lang } = useAdminSessionGate();
  // A regular end-user is not part of the admin credential space at all, but
  // the admin sign-in form still existing at a guessable URL leaks that an
  // admin panel exists. Rendering the same 404 a truly unknown route gets
  // keeps the panel's existence unconfirmed to anyone signed in as a normal
  // user (see RequireAdmin — the real security boundary is the separate
  // admin token, this is just not advertising the route on top of that).
  const isRegularUser = useAuthStore((s) => s.isAuthenticated);
  const loginMutation = useAdminLogin();

  const schema = z.object({
    email: z.string().email({ message: t("signIn.errors.emailInvalid") }),
    password: z.string().min(1, t("signIn.errors.passwordRequired")),
  });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  if (isRegularUser) {
    return <NotFound />;
  }

  if (restoring) return <RestoringScreen />;

  if (hasSession) {
    return <Navigate to={localizedPath(lang!, ROUTE_SEGMENTS.adminDashboard)} replace />;
  }

  async function onSubmit(values: Values) {
    try {
      await loginMutation.mutateAsync(values);
      navigate(localizedPath(lang!, ROUTE_SEGMENTS.adminDashboard), { replace: true });
    } catch {
      // useAdminLogin.onError already surfaced a toast; stay on page.
    }
  }

  return (
    <AdminAuthLayout>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-base-content text-lg font-semibold">
            {t("admin.signIn.title")}
          </h1>
          <p className="text-base-content/60 mt-1 text-sm">
            {t("admin.signIn.subtitle")}
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="label-text">{t("signIn.email")}</span>
            <input
              type="email"
              id="admin-signin-email"
              autoComplete="username"
              placeholder={t("signIn.email")}
              className="input input-bordered w-full"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "admin-signin-email-error" : undefined}
              {...register("email")}
            />
          </label>
          {errors.email && (
            <span
              id="admin-signin-email-error"
              role="alert"
              className="text-error text-sm"
            >
              {errors.email.message}
            </span>
          )}
          <label className="flex flex-col gap-1">
            <span className="label-text">{t("signIn.password")}</span>
            <PasswordInput
              id="admin-signin-password"
              autoComplete="current-password"
              placeholder={t("signIn.password")}
              className="input input-bordered w-full"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "admin-signin-password-error" : undefined
              }
              {...register("password")}
            />
          </label>
          {errors.password && (
            <span
              id="admin-signin-password-error"
              role="alert"
              className="text-error text-sm"
            >
              {errors.password.message}
            </span>
          )}
          <Button
            type="submit"
            className="btn btn-neutral mt-2"
            loading={loginMutation.isPending}
          >
            {t("admin.signIn.submit")}
          </Button>
        </form>
        <p className="text-base-content/50 flex items-center gap-1.5 text-xs">
          <Lock className="size-3.5 shrink-0" />
          {t("admin.signIn.notice")}
        </p>
      </div>
    </AdminAuthLayout>
  );
}
