import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { SmartImage } from "@/components/common/smart-image";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-context";
import { toErrorMessage } from "@/lib/http";
import { cn } from "@/lib/utils";

/**
 * حقل صورة يرفع الملف فعلياً بدل مطالبة المستخدم بلصق رابط.
 *
 * يرفع فور الاختيار ويعيد المسار الذي خزّنه الخادم، فيبقى النموذج يتعامل
 * مع نص واحد كما يتوقّع الباك اند.
 */
export function ImageUploadField({
  value,
  onChange,
  onUpload,
  label,
  hint,
  error,
  shape = "square",
  className,
}: {
  value?: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<{ url: string }>;
  label: string;
  hint?: string;
  error?: string;
  shape?: "square" | "circle";
  className?: string;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await onUpload(file);
      onChange(result.url);
    } catch (uploadError) {
      toast.error(toErrorMessage(uploadError));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-semibold text-basalt-800">{label}</span>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          aria-label={label}
          className={cn(
            "relative grid size-24 shrink-0 place-items-center overflow-hidden border-2 border-dashed border-basalt-900/15 bg-sand-50 transition-colors hover:border-gold-500 disabled:opacity-60",
            shape === "circle" ? "rounded-full" : "rounded-2xl",
            error && "border-clay-500",
          )}
        >
          {value ? (
            <SmartImage
              src={value}
              alt=""
              wrapperClassName="absolute inset-0"
              className="size-full"
            />
          ) : (
            <ImagePlus className="size-6 text-basalt-600/45" aria-hidden />
          )}

          {uploading ? (
            <span className="absolute inset-0 grid place-items-center bg-basalt-950/55">
              <Loader2 className="size-5 animate-spin text-sand-50" aria-hidden />
            </span>
          ) : null}
        </button>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={pick}
              loading={uploading}
            >
              <Upload />
              {t("common.upload")}
            </Button>

            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-clay-500 hover:bg-clay-500/10"
                onClick={() => onChange("")}
              >
                <Trash2 />
                {t("common.remove")}
              </Button>
            ) : null}
          </div>

          {hint ? (
            <p className="text-xs leading-relaxed text-basalt-600/70">{hint}</p>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {error ? (
        <p role="alert" className="text-xs font-medium text-clay-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
