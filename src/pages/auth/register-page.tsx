import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
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
import { PhoneField } from "@/components/common/phone-field";
import { useAuth } from "@/context/auth-context";
import { useT } from "@/i18n/locale-context";
import {
  DEFAULT_COUNTRY_ISO,
  buildInternationalPhone,
  digitsHint,
  findCountry,
  isValidNationalNumber,
} from "@/lib/country-codes";
import { useErrorMessage } from "@/lib/use-error-message";

/*
  القيود مطابقة لـ validations/user-auth.validation.ts في الباك اند،
  عدا طول الرقم: عدد الخانات يتبع الدولة المختارة، لذلك يُتحقَّق منه
  على مستوى النموذج كاملاً لا على مستوى الحقل وحده.
*/
const schema = z
  .object({
    name: z.string().trim().min(2),
    countryIso: z.string().min(2),
    phone: z.string(),
    /* البريد إلزامي — عليه يصل رمز التحقّق واستعادة كلمة المرور. */
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(6),
  })
  .refine(
    (values) =>
      isValidNationalNumber(findCountry(values.countryIso), values.phone),
    { path: ["phone"] },
  );

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<unknown>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      countryIso: DEFAULT_COUNTRY_ISO,
      phone: "",
      email: "",
      password: "",
    },
  });

  const countryIso = watch("countryIso");
  const phone = watch("phone");
  const country = findCountry(countryIso);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await registerUser({
        name: values.name,
        phone: buildInternationalPhone(country.dial, values.phone),
        email: values.email,
        password: values.password,
      });

      /* الجلسة لا تُفتح هنا — الرمز أُرسل إلى البريد. */
      navigate("/verify-email", {
        replace: true,
        state: { email: result.email ?? values.email },
      });
    } catch (error) {
      setServerError(error);
    }
  });

  return (
    <Card className="border-basalt-900/8">
      <CardHeader className="p-7 pb-2">
        <CardTitle className="font-display text-3xl">
          {t("auth.registerTitle")}
        </CardTitle>
        <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
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
              autoComplete="name"
              placeholder={t("ph.fullName")}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </Field>

          <Field
            label={t("auth.phone")}
            htmlFor="phone"
            hint={t("auth.phoneDigitsHint", { digits: digitsHint(country) })}
            error={
              errors.phone
                ? t("auth.phoneDigitsError", { digits: digitsHint(country) })
                : undefined
            }
          >
            <PhoneField
              countryIso={countryIso}
              onCountryChange={(iso) =>
                setValue("countryIso", iso, { shouldValidate: true })
              }
              value={phone}
              onValueChange={(next) =>
                setValue("phone", next, { shouldValidate: true })
              }
              invalid={!!errors.phone}
            />
          </Field>

          <Field
            label={t("auth.email")}
            htmlFor="email"
            hint={t("auth.emailRequiredHint")}
            error={errors.email ? t("auth.emailInvalid") : undefined}
          >
            <Input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </Field>

          <Field
            label={t("auth.password")}
            htmlFor="password"
            error={errors.password ? t("auth.passwordMin") : undefined}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
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
            <UserPlus />
            {t("auth.register")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-basalt-600/80">
          {t("auth.haveAccount")}{" "}
          <Link
            to="/login"
            className="font-bold text-basalt-900 underline underline-offset-4"
          >
            {t("auth.goLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
