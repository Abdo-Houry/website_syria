import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Sparkles } from "lucide-react";
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
import { useAuth } from "@/context/auth-context";
import { useT } from "@/i18n/locale-context";
import { useErrorMessage } from "@/lib/use-error-message";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
});

type FormValues = z.infer<typeof schema>;

/**
 * استكمال الملف الشخصي.
 * الحقول المسموح بتحديثها محدّدة في `updateProfileSchema` بالباك اند.
 */
export function CompleteProfilePage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<unknown>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updateProfile(values);
      toast.success(t("auth.profileCompleted"));
      navigate("/books", { replace: true });
    } catch (error) {
      setServerError(error);
    }
  });

  return (
    <Card className="border-basalt-900/8">
      <CardHeader className="p-7 pb-2">
        <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-bold text-gold-700">
          <Sparkles className="size-3.5" aria-hidden />
          {t("auth.completeProfileStep")}
        </span>
        <CardTitle className="font-display text-3xl">
          {t("auth.completeProfile")}
        </CardTitle>
        <CardDescription>{t("auth.completeProfileBody")}</CardDescription>
      </CardHeader>

      <CardContent className="p-7 pt-4">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <Field
            label={t("auth.name")}
            htmlFor="name"
            error={errors.name ? t("auth.nameMin") : undefined}
          >
            <Input
              id="name"
              placeholder={t("ph.fullName")}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </Field>

          <Field
            label={t("auth.email")}
            htmlFor="email"
            error={errors.email ? t("auth.emailInvalid") : undefined}
          >
            <Input
              id="email"
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
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
            {t("auth.saveAndContinue")}
            <ArrowLeft className="ltr:rotate-180" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
