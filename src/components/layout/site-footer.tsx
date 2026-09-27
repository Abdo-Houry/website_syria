import { Link } from "react-router-dom";
import { Facebook, HeartHandshake, Instagram, Mail, Phone } from "lucide-react";
import { BrandMark } from "@/components/common/brand-logo";
import { useJourney } from "@/context/journey-context";
import { isUserBookDeleted } from "@/features/books/booklet-card";
import { useT } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

/* بيانات التواصل والحسابات الرسمية — مكان واحد لتعديلها. */
export const CONTACT_EMAIL = "sakk.company.sy@gmail.com";
export const CONTACT_PHONE = "+963 930 599 100";

/**
 * أيقونات لا توجد في هذا الإصدار من lucide — مرسومة بمسارات العلامات
 * الرسمية بلون النصّ المحيط، فتتبع نفس حالات التحويم كبقية الأيقونات.
 */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M18.244 2H21.5l-7.51 8.58L22.83 22h-6.92l-5.42-7.09L4.3 22H1.04l8.03-9.18L0.6 2h7.1l4.9 6.48L18.24 2Zm-1.14 18.06h1.8L6.96 3.84H5.03l12.07 16.22Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06v-3.1a5.66 5.66 0 0 0-.77-.05A5.68 5.68 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M16.36 11.13c-.1-.05-.2-.09-.3-.13-.18-3.27-1.97-5.14-4.98-5.16h-.04c-1.8 0-3.3.77-4.22 2.17l1.66 1.14c.69-1.04 1.76-1.26 2.56-1.26h.03c1 0 1.75.29 2.23.86.35.42.59 1 .7 1.73a12.7 12.7 0 0 0-2.86-.14c-2.88.17-4.73 1.85-4.6 4.18.06 1.19.65 2.2 1.67 2.87.85.55 1.95.82 3.1.76 1.51-.08 2.7-.66 3.52-1.71.63-.8 1.03-1.84 1.2-3.15.73.44 1.26 1.02 1.56 1.72.5 1.19.53 3.15-1.06 4.74-1.4 1.4-3.08 2-5.6 2.02-2.81-.02-4.93-.92-6.31-2.67C3.32 17.46 2.65 15.1 2.62 12c.03-3.1.7-5.46 1.99-7.07C5.99 3.18 8.11 2.28 10.92 2.26c2.83.02 4.99.93 6.42 2.68.7.87 1.23 1.95 1.58 3.22l1.95-.52c-.42-1.55-1.09-2.9-2-4.02C17.03 1.4 14.35.24 10.93.22h-.01C7.51.24 4.86 1.4 3.04 3.66 1.43 5.67.6 8.47.57 11.99v.02c.03 3.52.86 6.32 2.47 8.33 1.82 2.26 4.47 3.42 7.89 3.44h.01c3.04-.02 5.18-.82 6.95-2.58 2.31-2.31 2.24-5.2 1.48-6.98-.55-1.28-1.6-2.32-3.01-3.09Zm-5.17 5.98c-1.27.07-2.59-.5-2.66-1.75-.05-.93.66-1.97 2.74-2.09.24-.01.47-.02.7-.02.75 0 1.46.07 2.1.21-.24 2.98-1.64 3.58-2.88 3.65Z" />
    </svg>
  );
}

export const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/sakk.company?igsi=OGtjbDlvdjAwajQx",
    icon: Instagram,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/14wE6k1NNgK/",
    icon: Facebook,
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@sakkcompany?_r=1&_t=ZS-99DXEyNIXTh",
    icon: TikTokIcon,
  },
  {
    name: "Threads",
    href: "https://www.threads.com/@sakk.company",
    icon: ThreadsIcon,
  },
  {
    name: "X",
    href: "https://x.com/sakkcompany",
    icon: XIcon,
  },
] as const;

/**
 * فوتر التطبيق — الشعار، روابط التعريف والتواصل، الحسابات الرسمية،
 * وعبارة التبرّع الخيري في شريط بارز أعلاه.
 */
export function SiteFooter({ className }: { className?: string }) {
  const t = useT();
  const year = new Date().getFullYear();

  /*
     صفحة الشركاء محميّة بـ `RequireBooklet`، فمن لا جواز له يُعاد إلى
     صفحة جوازاته بلا تفسير. نفس شرط الحارس يُطبَّق هنا فلا يظهر الرابط
     أصلاً لمن لا يستطيع فتحه — رابط غائب أهون من رابط يرتدّ.
  */
  const { userBooks } = useJourney();

  const hasBooklet =
    userBooks.some((item) => !isUserBookDeleted(item));

  const links = [
    { to: "/about", label: t("footer.about") },
    { to: "/faq", label: t("footer.faq") },
    { to: "/privacy", label: t("footer.privacy") },
    /* نفس تسمية الشركاء في شريط التنقّل — وجهة واحدة باسم واحد. */
    ...(hasBooklet ? [{ to: "/partners", label: t("nav.partners") }] : []),
  ];

  return (
    <footer className={cn("mt-10 lg:mt-14", className)}>
      {/* شريط التبرّع الخيري */}
      <div className="bg-gold-500 text-basalt-950">
        <p className="mx-auto flex w-full max-w-5xl items-center justify-center gap-2 px-4 py-3 text-center text-sm font-bold">
          <HeartHandshake className="size-4.5 shrink-0" aria-hidden />
          {t("footer.donation")}
        </p>
      </div>

      <div className="border-t border-basalt-900/8 bg-basalt-900 text-sand-100">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-5 md:grid-cols-3">
          {/* الشعار */}
          <div className="flex flex-col gap-3">
            <Link to="/journey" aria-label={t("app.name")} className="w-fit">
              <BrandMark tone="gold" className="h-11 px-4" wordmarkClassName="h-5" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-sand-100/65">
              {t("app.tagline")}
            </p>
          </div>

          {/* الروابط */}
          <nav aria-label={t("footer.links")}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-sand-100/45">
              {t("footer.links")}
            </h3>
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm font-semibold text-sand-100/85 transition-colors hover:text-gold-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* التواصل والحسابات */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-sand-100/45">
              {t("footer.contact")}
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 font-semibold text-sand-100/85 transition-colors hover:text-gold-400"
                >
                  <Mail className="size-4 shrink-0 text-gold-400" aria-hidden />
                  <span dir="ltr">{CONTACT_EMAIL}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-2 font-semibold text-sand-100/85 transition-colors hover:text-gold-400"
                >
                  <Phone className="size-4 shrink-0 text-gold-400" aria-hidden />
                  <span dir="ltr">{CONTACT_PHONE}</span>
                </a>
              </li>
            </ul>

            <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-sand-100/45">
              {t("footer.follow")}
            </h3>
            <ul className="flex flex-wrap items-center gap-2">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <li key={social.name}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      title={social.name}
                      className="grid size-10 place-items-center rounded-xl bg-white/8 text-sand-100 transition-colors hover:bg-gold-500 hover:text-basalt-950"
                    >
                      <Icon className="size-4.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <p className="mx-auto w-full max-w-5xl px-4 py-4 text-center text-xs text-sand-100/50 sm:px-5">
            {t("footer.rights", { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}
