import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";
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
import { useAuth } from "@/context/auth-context";
import { useT } from "@/i18n/locale-context";
import { useErrorMessage } from "@/lib/use-error-message";

const RESEND_COOLDOWN = 60;

/**
 * استعادة كلمة المرور على خطوتين في صفحة واحدة:
 * طلب الرمز على البريد، ثم إدخال الرمز مع كلمة المرور الجديدة.
 *
 * نجاح التعيين يفتح الجلسة مباشرة — من أثبت ملكية بريده لا معنى
 * لإعادة إرساله إلى صفحة الدخول ليكتب ما كتبه للتوّ.
 */
export function ForgotPasswordPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const navigate = useNavigate();
  const { signInWithToken } = useAuth();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [serverError, setServerError] = useState<unknown>(null);

  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [cooldown]);

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setServerError(null);
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep("reset");
      setCooldown(RESEND_COOLDOWN);
      toast.success(t("auth.resetCodeSent"));
    } catch (error) {
      setServerError(error);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    setBusy(true);
    try {
      const result = await authApi.resetPassword(
        email.trim(),
        code.trim(),
        password,
      );
      await signInWithToken(result.token);
      toast.success(t("auth.passwordReset"));
      navigate("/books", { replace: true });
    } catch (error) {
      setServerError(error);
    } finally {
      setBusy(false);
    }
  };

  const errorBox = serverError ? (
    <p
      role="alert"
      className="rounded-2xl border border-clay-500/25 bg-clay-500/8 px-4 py-3 text-sm font-medium text-clay-500"
    >
      {toErrorMessage(serverError)}
    </p>
  ) : null;

  return (
    <Card className="border-basalt-900/8">
      <CardHeader className="p-7 pb-2">
        <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-gold-500/15 text-gold-700">
          <KeyRound className="size-6" aria-hidden />
        </span>
        <CardTitle className="font-display text-3xl">
          {t("auth.forgotTitle")}
        </CardTitle>
        <CardDescription>
          {step === "request"
            ? t("auth.forgotSubtitle")
            : t("auth.forgotCodeSubtitle", { email })}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-7 pt-4">
        {step === "request" ? (
          <form
            onSubmit={requestCode}
            noValidate
            className="flex flex-col gap-5"
          >
            <Field
              label={t("auth.email")}
              htmlFor="forgot-email"
              hint={t("auth.forgotEmailHint")}
            >
              <Input
                id="forgot-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            {errorBox}

            <Button
              type="submit"
              size="lg"
              block
              loading={busy}
              disabled={!email.trim()}
            >
              <ArrowRight className="ltr:rotate-180" />
              {t("auth.sendResetCode")}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={resetPassword}
            noValidate
            className="flex flex-col gap-5"
          >
            <Field
              label={t("auth.verificationCode")}
              htmlFor="reset-code"
              hint={t("auth.verificationCodeHint")}
            >
              <Input
                id="reset-code"
                dir="ltr"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="XXXXXX"
                className="text-center text-lg font-bold tracking-[0.6em] tabular-nums"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </Field>

            <Field
              label={t("auth.newPassword")}
              htmlFor="reset-password"
              hint={t("auth.passwordMin")}
            >
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            {errorBox}

            <Button
              type="submit"
              size="lg"
              block
              loading={busy}
              disabled={code.length < 4 || password.length < 6}
            >
              <ShieldCheck />
              {t("auth.setNewPassword")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={busy && cooldown === 0}
              disabled={cooldown > 0}
              onClick={() => void requestCode()}
            >
              <RotateCcw />
              {cooldown > 0
                ? t("auth.resendIn", { seconds: cooldown })
                : t("auth.resendCode")}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-basalt-600/80">
          <Link
            to="/login"
            className="font-bold text-basalt-900 underline underline-offset-4"
          >
            {t("auth.backToLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
