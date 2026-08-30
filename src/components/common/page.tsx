import { useEffect } from "react";
import { useT } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

/** حاوية صفحة موحّدة + ضبط عنوان المتصفح. */
export function Page({
  title,
  children,
  className,
  bleed,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** عند true تمتد الصفحة إلى الحواف (للصفحات ذات الغلاف الكبير). */
  bleed?: boolean;
}) {
  const t = useT();
  const appName = t("app.name");

  useEffect(() => {
    document.title = `${title} — ${appName}`;
  }, [title, appName]);

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl animate-fade-up",
        bleed ? "px-0 sm:px-5" : "px-4 sm:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** فاصل رأسي بين أقسام الصفحة. */
export function PageSection({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-7", className)} {...props} />;
}
