import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Calendar, LogOut, Save, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { ImageUploadField } from "@/components/common/image-upload-field";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { uploadsApi } from "@/api/uploads.api";
import { useAuth } from "@/context/auth-context";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { useErrorMessage } from "@/lib/use-error-message";
import { assetUrl, formatDate, initials } from "@/lib/utils";

/* الحقول المتاحة للتحديث مطابقة لـ updateProfileSchema في الباك اند. */
const schema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  /* البريد إلزامي على مستوى الحساب، فلا يجوز تفريغه من هنا. */
  email: z.string().trim().toLowerCase().email(),
});

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();
  const { user, updateProfile, logout } = useAuth();
  const { userBooks } = useJourney();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<unknown>(null);
  const [image, setImage] = useState(user?.image ?? "");

  useEffect(() => {
    setImage(user?.image ?? "");
  }, [user?.image]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updateProfile({
        name: values.name,
        phone: values.phone,
        email: values.email,
        ...(image ? { image } : {}),
      });
      toast.success(t("profile.saved"));
    } catch (error) {
      setServerError(error);
    }
  });

  return (
    <Page title={t("profile.title")}>
      <PageSection>
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-l from-basalt-900 via-basalt-800 to-basalt-600" />
          <CardContent className="-mt-10 p-5 pt-0">
            <Avatar className="size-20 ring-4 ring-white">
              <AvatarImage src={assetUrl(user?.image)} alt={user?.name ?? ""} />
              <AvatarFallback className="text-xl">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>

            <h1 className="mt-3 font-display text-2xl text-basalt-900">
              {user?.name ?? t("common.none")}
            </h1>
            <p className="mt-0.5 text-sm text-basalt-600/80" dir="ltr">
              {user?.phone ?? t("common.none")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={user?.status === "ACTIVE" ? "success" : "danger"}>
                <ShieldCheck />
                {user?.status === "ACTIVE"
                  ? t("profile.activeAccount")
                  : t("profile.blockedAccount")}
              </Badge>
              <Badge variant="neutral">
                <BookOpen />
                {t("profile.booksCount", { count: userBooks.length })}
              </Badge>
              <Badge variant="neutral">
                <Calendar />
                {t("profile.memberSince", {
                  date: formatDate(user?.created_at, locale),
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection className="pt-0">
        <SectionHeader icon={UserIcon} title={t("profile.myData")} />

        <Card>
          <CardContent className="p-5 pt-5">
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
              <ImageUploadField
                label={t("profile.avatar")}
                hint={t("profile.avatarHint")}
                shape="circle"
                value={image}
                onChange={setImage}
                onUpload={(file) => uploadsApi.userImage(file)}
              />

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
                label={t("auth.phone")}
                htmlFor="phone"
                error={errors.phone ? t("auth.phoneMin") : undefined}
              >
                <Input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  placeholder="9XXXXXXXX"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
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

              <Button type="submit" loading={isSubmitting} className="w-fit">
                <Save />
                {t("common.saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection className="pt-0">
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-basalt-800">
                {t("common.language")}
              </span>
              <LanguageSwitcher />
            </div>

            <Separator />

            <Button variant="subtle" block asChild>
              <Link to="/books">
                <BookOpen />
                {t("books.manage")}
              </Link>
            </Button>

            <Separator />

            <Button
              variant="ghost"
              block
              className="text-clay-500 hover:bg-clay-500/8"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <LogOut />
              {t("auth.logout")}
            </Button>
          </CardContent>
        </Card>
      </PageSection>
    </Page>
  );
}
