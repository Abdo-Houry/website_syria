import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { SmartImage } from "@/components/common/smart-image";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-context";
import { assetUrl, toErrorMessage } from "@/lib/utils-media";

export interface MediaItem {
  id: number;
  url: string;
  title?: string | null;
}

/**
 * إدارة وسائط متعدّدة: عرض الموجود، رفع دفعة جديدة، وحذف عنصر مفرد.
 *
 * الحدود (10 صور / 5 مقاطع) مطابقة لإعداد multer في مسارات الوسائط.
 */
export function MediaManager({
  kind,
  items,
  onUpload,
  onDelete,
  onChanged,
}: {
  kind: "images" | "videos";
  items: MediaItem[];
  onUpload: (files: File[]) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  onChanged: () => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selected, setSelected] = useState<File[]>([]);

  const isImages = kind === "images";
  const max = isImages ? 10 : 5;

  const upload = useMutation({
    mutationFn: onUpload,
    onSuccess: () => {
      toast.success(
        isImages ? t("admin.imagesUploaded") : t("admin.videosUploaded"),
      );
      setSelected([]);
      if (inputRef.current) inputRef.current.value = "";
      onChanged();
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: onDelete,
    onSuccess: () => {
      toast.success(t("common.deleted"));
      onChanged();
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });

  return (
    <section className="rounded-2xl border border-dashed border-basalt-900/15 bg-sand-50/60 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-basalt-700">
          {isImages ? (
            <ImagePlus className="size-5" aria-hidden />
          ) : (
            <Video className="size-5" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-basalt-900">
            {isImages ? t("admin.images") : t("admin.videos")}
            <span className="ms-2 text-xs font-normal text-basalt-600/70">
              ({items.length})
            </span>
          </p>
          <p className="text-xs text-basalt-600/70">
            {t("admin.uploadLimit", { max })}
          </p>
        </div>
      </header>

      {/* الموجود حالياً */}
      {items.length ? (
        <ul
          className={
            isImages
              ? "mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5"
              : "mt-3 grid gap-2 sm:grid-cols-2"
          }
        >
          {items.map((item) => (
            <li key={item.id} className="group relative">
              {isImages ? (
                <SmartImage
                  src={item.url}
                  alt=""
                  wrapperClassName="aspect-square overflow-hidden rounded-xl"
                  className="size-full"
                />
              ) : (
                <video
                  src={assetUrl(item.url)}
                  className="aspect-video w-full rounded-xl bg-black"
                  preload="metadata"
                  controls
                />
              )}

              <button
                type="button"
                aria-label={
                  isImages ? t("admin.deleteImage") : t("admin.deleteVideo")
                }
                disabled={remove.isPending}
                onClick={() => remove.mutate(item.id)}
                className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-basalt-950/70 text-sand-50 opacity-0 transition-opacity hover:bg-clay-500 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

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
            {t("admin.filesReady", { count: selected.length })}
          </p>
          <Button
            type="button"
            size="sm"
            loading={upload.isPending}
            onClick={() => upload.mutate(selected)}
          >
            <Upload />
            {t("common.upload")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
