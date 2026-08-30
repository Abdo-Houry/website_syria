import { Camera, Database, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { CONTACT_EMAIL } from "@/components/layout/site-footer";
import { useT } from "@/i18n/locale-context";
import type { MessageKey } from "@/i18n/messages/ar";

const SECTIONS: { icon: LucideIcon; title: MessageKey; body: MessageKey }[] = [
  { icon: Database, title: "privacy.collectTitle", body: "privacy.collectBody" },
  { icon: Sparkles, title: "privacy.useTitle", body: "privacy.useBody" },
  { icon: Camera, title: "privacy.cameraTitle", body: "privacy.cameraBody" },
  { icon: Lock, title: "privacy.securityTitle", body: "privacy.securityBody" },
];

/** سياسة الخصوصية — نصّ ثابت مترجَم من القاموس. */
export function PrivacyPage() {
  const t = useT();

  return (
    <Page title={t("privacy.title")}>
      <PageSection>
        <SectionHeader
          icon={ShieldCheck}
          title={t("privacy.title")}
          description={t("privacy.subtitle")}
        />

        <div className="flex flex-col gap-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <article
                key={section.title}
                className="flex items-start gap-4 rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white p-5 shadow-[var(--shadow-soft)]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-500/15 text-gold-700">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-basalt-900">
                    {t(section.title)}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-basalt-700">
                    {t(section.body)}
                  </p>
                </div>
              </article>
            );
          })}

          <article className="flex items-start gap-4 rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-basalt-900 p-5 text-sand-50 shadow-[var(--shadow-soft)]">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-500 text-basalt-950">
              <Mail className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold">{t("privacy.contactTitle")}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-sand-100/75">
                {t("privacy.contactBody")}
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                dir="ltr"
                className="mt-2 inline-block font-bold text-gold-400 underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </article>
        </div>
      </PageSection>
    </Page>
  );
}
