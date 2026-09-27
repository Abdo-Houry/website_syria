import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Save, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { adminAuthApi } from "@/api/admin/admin-auth.api";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useT } from "@/i18n/locale-context";
import { useErrorMessage } from "@/lib/use-error-message";

/* القيود مطابقة لـ updateAdminProfileSchema في الباك اند. */
const schema = z
  .object({
    username: z.string().trim().min(3),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6).optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

type FormValues = z.infer<typeof schema>;

/**
 * حساب المشرف — تغيير اسم المستخدم و/أو كلمة المرور.
 * كلمة المرور الحالية مطلوبة دائماً، والخادم يعيد توكناً جديداً
 * لأن التوكن يحمل اسم المستخدم.
 */
export function AdminProfilePage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { admin, applySession } = useAdminAuth();
  const [serverError, setServerError] = useState<unknown>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: admin?.username ?? "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const usernameChanged = values.username !== admin?.username;
      return adminAuthApi.updateProfile({
        currentPassword: values.currentPassword,
        ...(usernameChanged ? { username: values.username } : {}),
        ...(values.newPassword ? { newPassword: values.newPassword } : {}),
      });
    },
    onSuccess: (result) => {
      applySession(result.admin, result.token);
      toast.success(t("admin.profileUpdated"));
      form.reset({
        username: result.admin.username,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => setServerError(error),
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    const usernameChanged = values.username !== admin?.username;
    if (!usernameChanged && !values.newPassword) {
      toast.info(t("admin.nothingToUpdate"));
      return;
    }
    mutation.mutate(values);
  });

  const { errors } = form.formState;

  return (
    <AdminPage
      icon={UserCog}
      title={t("admin.profile")}
      description={t("admin.profileHint")}
    >
      <Card className="max-w-xl">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-lg">{admin?.username}</CardTitle>
          <CardDescription>{t("admin.leaveBlank")}</CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-4">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <Field
              label={t("admin.username")}
              htmlFor="admin-username"
              error={errors.username ? t("admin.usernameRequired") : undefined}
            >
              <Input
                id="admin-username"
                dir="ltr"
                autoComplete="username"
                placeholder={t("ph.username")}
                aria-invalid={!!errors.username}
                {...form.register("username")}
              />
            </Field>

            <div className="h-px bg-sand-200" />

            <Field
              label={t("admin.newPassword")}
              htmlFor="admin-new-password"
              hint={t("admin.leaveBlank")}
              error={errors.newPassword ? t("auth.passwordMin") : undefined}
            >
              <Input
                id="admin-new-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={!!errors.newPassword}
                {...form.register("newPassword")}
              />
            </Field>

            <Field
              label={t("admin.confirmPassword")}
              htmlFor="admin-confirm-password"
              error={errors.confirmPassword ? t("admin.passwordsMismatch") : undefined}
            >
              <Input
                id="admin-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={!!errors.confirmPassword}
                {...form.register("confirmPassword")}
              />
            </Field>

            <div className="h-px bg-sand-200" />

            <Field
              label={t("admin.currentPassword")}
              htmlFor="admin-current-password"
              error={
                errors.currentPassword ? t("admin.currentPasswordRequired") : undefined
              }
            >
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-basalt-600/45"
                  aria-hidden
                />
                <Input
                  id="admin-current-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="ps-11"
                  aria-invalid={!!errors.currentPassword}
                  {...form.register("currentPassword")}
                />
              </div>
            </Field>

            {serverError ? (
              <p
                role="alert"
                className="rounded-2xl border border-clay-500/25 bg-clay-500/8 px-4 py-3 text-sm font-medium text-clay-500"
              >
                {toErrorMessage(serverError)}
              </p>
            ) : null}

            <Button type="submit" size="lg" loading={mutation.isPending}>
              <Save />
              {t("common.saveChanges")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
