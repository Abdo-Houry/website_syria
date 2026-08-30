import { useQuery } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { faqsApi } from "@/api/faqs.api";
import { queryKeys } from "@/app/query-client";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";

export function FaqPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();

  const query = useQuery({
    queryKey: queryKeys.faqs,
    queryFn: faqsApi.list,
    staleTime: 10 * 60_000,
  });

  const faqs = (query.data ?? []).filter((faq) => faq.status);

  return (
    <Page title={t("faq.title")}>
      <PageSection>
        <SectionHeader
          icon={HelpCircle}
          title={t("faq.title")}
          description={t("faq.subtitle")}
        />

        {query.isPending ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={toErrorMessage(query.error)}
            isNetwork={
              query.error instanceof ApiRequestError && query.error.isNetworkError
            }
            onRetry={() => void query.refetch()}
          />
        ) : faqs.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title={t("faq.empty")}
            description={t("faq.emptyBody")}
          />
        ) : (
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={String(faq.id)}>
                <AccordionTrigger>{tField(faq, "question", locale)}</AccordionTrigger>
                <AccordionContent>{tField(faq, "answer", locale)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </PageSection>
    </Page>
  );
}
