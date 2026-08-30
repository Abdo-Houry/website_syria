import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
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
import { toErrorMessage } from "@/lib/http";

/** زر حذف مع تأكيد صريح — الحذف في الباك اند soft delete. */
export function ConfirmDeleteButton({
  label,
  onDelete,
  onDeleted,
}: {
  label: string;
  onDelete: () => Promise<unknown>;
  onDeleted?: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: onDelete,
    onSuccess: () => {
      toast.success(t("common.deleted"));
      setOpen(false);
      onDeleted?.();
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${t("common.delete")} ${label}`}
        className="text-basalt-600/60 hover:bg-clay-500/10 hover:text-clay-500"
        onClick={() => setOpen(true)}
      >
        <Trash2 />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <span className="mb-1 grid size-11 place-items-center rounded-2xl bg-clay-500/12 text-clay-500">
              <TriangleAlert className="size-5" aria-hidden />
            </span>
            <DialogTitle>{t("admin.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("admin.deleteConfirmBody", { name: label })}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="pb-2" />

          <DialogFooter>
            <Button
              variant="danger"
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              <Trash2 />
              {t("common.delete")}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
