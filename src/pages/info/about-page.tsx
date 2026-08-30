import { HeartHandshake, Info, Mail, Phone } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { CONTACT_EMAIL, CONTACT_PHONE, SOCIAL_LINKS } from "@/components/layout/site-footer";
import { useT } from "@/i18n/locale-context";

/** صفحة «من نحن» — نصّ تعريفي ثابت مترجَم من القاموس. */
export function AboutPage() {
  const t = useT();

  return (
    <Page title={t("about.title")}>
      <PageSection>
        <SectionHeader
          icon={Info}
          title={t("about.title")}
          description={t("about.subtitle")}
        />

        <article className="rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="flex flex-col gap-4 text-base leading-loose text-basalt-800">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </div>

          <p className="mt-6 flex items-start gap-3 rounded-2xl bg-gold-500/12 p-4 text-sm font-semibold leading-relaxed text-basalt-900">
            <HeartHandshake className="mt-0.5 size-5 shrink-0 text-gold-700" aria-hidden />
            {t("about.p3")}
          </p>

          <h2 className="mt-8 text-lg font-bold text-basalt-900">
            {t("about.contactTitle")}
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 font-semibold text-basalt-800 hover:text-gold-700"
              >
                <Mail className="size-4 text-gold-600" aria-hidden />
                <span dir="ltr">{CONTACT_EMAIL}</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 font-semibold text-basalt-800 hover:text-gold-700"
              >
                <Phone className="size-4 text-gold-600" aria-hidden />
                <span dir="ltr">{CONTACT_PHONE}</span>
              </a>
            </li>
          </ul>

          <ul className="mt-4 flex items-center gap-2">
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
                    className="grid size-10 place-items-center rounded-xl bg-basalt-900 text-sand-50 transition-colors hover:bg-gold-500 hover:text-basalt-950"
                  >
                    <Icon className="size-4.5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </article>
      </PageSection>
    </Page>
  );
}
