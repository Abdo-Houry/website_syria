import type { ReactNode } from "react";
import { Save } from "lucide-react";
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
import { useT } from "@/i18n/locale-context";
import { useErrorMessage } from "@/lib/use-error-message";

/**
 * غلاف موحّد لنماذج الإنشاء والتعديل في لوحة الإدارة.
 * كل صفحة تمرّر حقولها فقط، فلا يتكرّر هيكل الحوار في كل مورد.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  isSubmitting,
  submitLabel,
  serverError,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  /** الخطأ كما وصل — تُترجَم رسالته هنا لتتبدّل مع تبديل اللغة. */
  serverError?: unknown;
  children: ReactNode;
}) {
  const t = useT();
  const toErrorMessage = useErrorMessage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4 py-4">
            {children}

            {serverError ? (
              <p
                role="alert"
                className="rounded-2xl border border-clay-500/25 bg-clay-500/8 px-4 py-3 text-sm font-medium text-clay-500"
              >
                {toErrorMessage(serverError)}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              <Save />
              {submitLabel ?? t("common.save")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
