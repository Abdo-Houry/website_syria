import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import { cn } from "@/lib/utils";

/**
 * مبدّل الكتيّب — يُظهر سياق الرحلة الحالي بوضوح ويسمح بالتنقّل بين
 * كتيّبات مستقلة تماماً.
 */
export function BookletSwitcher() {
  const t = useT();
  const { locale } = useLocale();
  const { userBooks, activeUserBook, setActiveUserBookId } = useJourney();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const activeBook = activeUserBook?.book_copy?.book;

  if (!userBooks.length) {
    return (
      <Button
        variant="gold"
        size="sm"
        onClick={() => navigate("/books/activate")}
        className="shrink-0"
      >
        <Plus />
        {t("books.activate")}
      </Button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex min-w-0 max-w-[62vw] items-center gap-2 rounded-full border border-basalt-900/10 bg-white/80 py-1.5 pe-3 ps-2 text-start transition-colors hover:border-basalt-900/25 sm:max-w-xs"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-basalt-900 text-gold-300">
          <BookOpen className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold leading-tight text-basalt-900">
            {activeBook ? tField(activeBook, "name", locale) : t("admin.book")}
          </span>
          {activeBook?.province ? (
            <span className="block truncate text-[10px] leading-tight text-basalt-600/70">
              {tField(activeBook.province, "name", locale)}
            </span>
          ) : null}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-basalt-600/50" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("books.chooseJourney")}</DialogTitle>
            <DialogDescription>{t("books.chooseJourneyBody")}</DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-2 pb-2">
            {userBooks.map((userBook) => {
              const book = userBook.book_copy?.book;
              const isActive = userBook.id === activeUserBook?.id;
              return (
                <button
                  key={userBook.id}
                  type="button"
                  onClick={() => {
                    setActiveUserBookId(userBook.id);
                    setOpen(false);
                    navigate("/journey");
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-start transition-colors",
                    isActive
                      ? "border-gold-500 bg-gold-500/8"
                      : "border-basalt-900/10 hover:border-basalt-900/25 hover:bg-sand-50",
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-basalt-900 text-gold-300">
                    <BookOpen className="size-4.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-basalt-900">
                      {book ? tField(book, "name", locale) : `#${userBook.id}`}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-basalt-600/75">
                      <span>
                        {book?.province
                          ? tField(book.province, "name", locale)
                          : t("common.none")}
                      </span>
                      <span aria-hidden>•</span>
                      <span dir="ltr">
                        {userBook.book_copy?.serial_number ?? t("common.none")}
                      </span>
                    </span>
                  </span>
                  {isActive ? (
                    <Badge variant="gold">
                      <Check />
                      {t("books.active")}
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => {
                setOpen(false);
                navigate("/books/activate");
              }}
            >
              <Plus />
              {t("books.activateNew")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
