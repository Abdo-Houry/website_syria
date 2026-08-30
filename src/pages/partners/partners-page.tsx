import { Handshake } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { PartnerCard } from "@/features/partners/partner-card";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";

/** شركاء الكتيّب — يأتون ضمن محتوى الكتيّب النشط، لا كقائمة عامة. */
export function PartnersPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();
  const { partners, isLoadingBook, bookError, book } = useJourney();

  const bookName = book ? tField(book, "name", locale) : "";

  return (
    <Page title={t("partners.title")}>
      <PageSection>
        <SectionHeader
          icon={Handshake}
          title={t("partners.title")}
          description={
            bookName
              ? t("partners.subtitleNamed", { name: bookName })
              : t("partners.subtitle")
          }
        />

        {isLoadingBook ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-32 rounded-[var(--radius-xl2)]" />
            ))}
          </div>
        ) : bookError ? (
          <ErrorState
            message={toErrorMessage(bookError)}
            isNetwork={
              bookError instanceof ApiRequestError && bookError.isNetworkError
            }
          />
        ) : partners.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title={t("partners.empty")}
            description={t("partners.emptyBody")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </PageSection>
    </Page>
  );
}
