import { useNavigate } from "react-router-dom";
import { BookOpen, Plus } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import { SkeletonCardGrid } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { BookletCard } from "@/features/books/booklet-card";
import { useJourney } from "@/context/journey-context";
import { useT } from "@/i18n/locale-context";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";

export function MyBooksPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const {
    userBooks,
    isLoadingBooks,
    booksError,
    refetchUserBooks,
    activeUserBook,
    setActiveUserBookId,
    progress,
  } = useJourney();
  const navigate = useNavigate();

  return (
    <Page title={t("books.title")}>
      <PageSection>
        <SectionHeader
          icon={BookOpen}
          title={t("books.title")}
          description={t("books.subtitle")}
          action={
            userBooks.length ? (
              <Button
                variant="gold"
                size="sm"
                onClick={() => navigate("/books/activate")}
              >
                <Plus />
                {t("books.new")}
              </Button>
            ) : null
          }
        />

        {isLoadingBooks ? (
          <SkeletonCardGrid count={2} />
        ) : booksError ? (
          <ErrorState
            message={toErrorMessage(booksError)}
            isNetwork={
              booksError instanceof ApiRequestError && booksError.isNetworkError
            }
            onRetry={refetchUserBooks}
          />
        ) : userBooks.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t("books.empty")}
            description={t("books.emptyBody")}
            action={
              <Button size="lg" onClick={() => navigate("/books/activate")}>
                <Plus />
                {t("books.activate")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {userBooks.map((userBook) => (
              <BookletCard
                key={userBook.id}
                userBook={userBook}
                isActive={userBook.id === activeUserBook?.id}
                progress={
                  userBook.id === activeUserBook?.id ? progress.overall : undefined
                }
                onSelect={setActiveUserBookId}
              />
            ))}
          </div>
        )}
      </PageSection>
    </Page>
  );
}
