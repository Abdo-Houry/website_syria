import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toErrorMessage } from "@/lib/http";

/**
 * رفع وسائط لمحافظة أو مكان.
 * أسماء الحقول (`images` / `videos`) وحدودها (10 و5) مطابقة لإعداد multer
 * في مسارات الوسائط بالباك اند.
 */
export function MediaUploader({
  kind,
  onUpload,
  onUploaded,
}: {
  kind: "images" | "videos";
  onUpload: (files: File[]) => Promise<unknown>;
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selected, setSelected] = useState<File[]>([]);

  const isImages = kind === "images";
  const max = isImages ? 10 : 5;

  const mutation = useMutation({
    mutationFn: onUpload,
    onSuccess: () => {
      toast.success(isImages ? "تم رفع الصور" : "تم رفع المقاطع");
      setSelected([]);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.();
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });

  return (
    <div className="rounded-2xl border border-dashed border-basalt-900/15 bg-sand-50/60 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-basalt-700">
          {isImages ? (
            <ImagePlus className="size-5" aria-hidden />
          ) : (
            <Video className="size-5" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-basalt-900">
            {isImages ? "صور" : "مقاطع مرئية"}
          </p>
          <p className="text-xs text-basalt-600/70">
            حتى {max} ملفات في المرة الواحدة.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={isImages ? "image/*" : "video/*"}
        onChange={(event) =>
          setSelected(Array.from(event.target.files ?? []).slice(0, max))
        }
        className="mt-3 block w-full text-sm text-basalt-700 file:me-3 file:rounded-full file:border-0 file:bg-basalt-900 file:px-4 file:py-2 file:text-xs file:font-bold file:text-sand-50 hover:file:bg-basalt-800"
      />

      {selected.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-xs text-basalt-600/80">
            {selected.length} ملف جاهز للرفع
          </p>
          <Button
            size="sm"
            loading={mutation.isPending}
            onClick={() => mutation.mutate(selected)}
          >
            <Upload />
            رفع
          </Button>
        </div>
      ) : null}
    </div>
  );
}
