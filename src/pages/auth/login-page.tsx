import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { authApi } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/http";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useAuth } from "@/context/auth-context";
import { useT } from "@/i18n/locale-context";
import { useErrorMessage } from "@/lib/use-error-message";

const schema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

/**
 * دخول موحّد.
 *
 * الحساب هو ما يحدّد الوجهة: الباك اند يعيد `role`، فنفتح جلسة المستخدم
 * أو جلسة المشرف بحسبها. لا يحتاج أحد إلى معرفة رابط دخول خاص.
 */
export function LoginPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { signInWithToken } = useAuth();
  const { applySession } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<unknown>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await authApi.login(values.identifier, values.password);

      if (result.role === "ADMIN") {
        applySession(result.admin, result.token);
        toast.success(t("auth.welcomeBack"));
        navigate("/admin", { replace: true });
        return;
      }

      await signInWithToken(result.token);
      toast.success(t("auth.welcomeBack"));
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/journey", { replace: true });
    } catch (error) {
      /*
        حساب أُنشئ ولم يُؤكَّد بريده: الدخول مسدود حتى إدخال الرمز،
        فننقله إلى شاشة التحقّق بدل تركه أمام رسالة خطأ بلا مخرج.
      */
      if (
        error instanceof ApiRequestError &&
        error.messageKey === "errors.emailNotVerified"
      ) {
        navigate("/verify-email", { state: { email: "" } });
        return;
      }
      setServerError(error);
    }
  });

  return (
    <Card className="border-basalt-900/8">
      <CardHeader className="p-7 pb-2">
        <CardTitle className="font-display text-3xl">{t("auth.login")}</CardTitle>
        <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
      </CardHeader>

      <CardContent className="p-7 pt-4">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <Field
            label={t("auth.identifier")}
            htmlFor="identifier"
            hint={t("auth.identifierHint")}
            error={errors.identifier ? t("auth.identifierRequired") : undefined}
          >
            <Input
              id="identifier"
              autoComplete="username"
              placeholder="997980231"
              aria-invalid={!!errors.identifier}
              {...register("identifier")}
            />
          </Field>

          <Field
            label={t("auth.password")}
            htmlFor="password"
            error={errors.password ? t("auth.passwordRequired") : undefined}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
          </Field>

          {serverError ? (
            <p
              role="alert"
              className="rounded-2xl border border-clay-500/25 bg-clay-500/8 px-4 py-3 text-sm font-medium text-clay-500"
            >
              {toErrorMessage(serverError)}
            </p>
          ) : null}

          <Button type="submit" size="lg" block loading={isSubmitting}>
            <LogIn />
            {t("auth.loginCta")}
          </Button>
        </form>

        <p className="mt-5 text-center">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-basalt-700 underline underline-offset-4 hover:text-basalt-900"
          >
            {t("auth.forgotPassword")}
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-basalt-600/80">
          {t("auth.noAccount")}{" "}
          <Link
            to="/register"
            className="font-bold text-basalt-900 underline underline-offset-4"
          >
            {t("auth.createAccount")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
