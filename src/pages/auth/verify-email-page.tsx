import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck, RotateCcw, ShieldCheck } from "lucide-react";
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

/** ثوانٍ قبل السماح بإعادة إرسال الرمز — يمنع إغراق صندوق البريد. */
const RESEND_COOLDOWN = 60;

/**
 * تأكيد البريد برمز التحقّق.
 *
 * التسجيل يحفظ الحساب دون جلسة، والجلسة تُفتح هنا فقط بعد إدخال الرمز
 * الصحيح — فلا يوجد حساب ببريد لا يملكه صاحبه.
 *
 * البريد يصل عبر `location.state` بعد التسجيل، ويبقى قابلاً للتحرير لمن
 * وصل الصفحة مباشرة (مثلاً بعد محاولة دخول بحساب غير مؤكَّد).
 */
export function VerifyEmailPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithToken } = useAuth();

  const passedEmail =
    (location.state as { email?: string } | null)?.email ?? "";

  const [email, setEmail] = useState(passedEmail);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(passedEmail ? RESEND_COOLDOWN : 0);
  const [serverError, setServerError] = useState<unknown>(null);

  /* مؤقّت إعادة الإرسال — يعمل ما دام العدّاد فوق الصفر. */
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    setBusy(true);
    try {
      const result = await authApi.verifyOtp(email.trim(), code.trim());
      await signInWithToken(result.token);
      toast.success(t("auth.emailVerified"));
      navigate("/books", { replace: true });
    } catch (error) {
      setServerError(error);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setServerError(null);
    setResending(true);
    try {
      await authApi.resendOtp(email.trim());
      setCooldown(RESEND_COOLDOWN);
      toast.success(t("auth.codeResent"));
    } catch (error) {
      setServerError(error);
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="border-basalt-900/8">
      <CardHeader className="p-7 pb-2">
        <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-gold-500/15 text-gold-700">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <CardTitle className="font-display text-3xl">
          {t("auth.verifyTitle")}
        </CardTitle>
        <CardDescription>
          {email
            ? t("auth.verifySubtitleWithEmail", { email })
            : t("auth.verifySubtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-7 pt-4">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <Field label={t("auth.email")} htmlFor="verify-email">
            <Input
              id="verify-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field
            label={t("auth.verificationCode")}
            htmlFor="verify-code"
            hint={t("auth.verificationCodeHint")}
          >
            <Input
              id="verify-code"
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

          {serverError ? (
            <p
              role="alert"
              className="rounded-2xl border border-clay-500/25 bg-clay-500/8 px-4 py-3 text-sm font-medium text-clay-500"
            >
              {toErrorMessage(serverError)}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            block
            loading={busy}
            disabled={code.length < 4 || !email.trim()}
          >
            <ShieldCheck />
            {t("auth.verifyCta")}
          </Button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            loading={resending}
            disabled={cooldown > 0 || !email.trim()}
            onClick={() => void resend()}
          >
            <RotateCcw />
            {cooldown > 0
              ? t("auth.resendIn", { seconds: cooldown })
              : t("auth.resendCode")}
          </Button>

          <Link
            to="/login"
            className="text-sm font-bold text-basalt-900 underline underline-offset-4"
          >
            {t("auth.goLogin")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
