import { useEffect, useState } from "react";
import { useT } from "@/i18n/locale-context";
import { renderQrDataUrl } from "@/lib/qr-image";
import { cn } from "@/lib/utils";

/**
 * يرسم رمز الـ QR من `qr_value` المخزَّن في الباك اند، وفي مركزه شعار «صك».
 *
 * الباك اند لا يعيد صورة الرمز عند إنشاء نسخة الكتيّب — يعيد النص فقط —
 * لذلك نولّد الصورة هنا، وهو ما يتيح أيضاً الطباعة بأي مقاس دون فقد جودة.
 */
export function QrImage({
  value,
  size = 180,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const t = useT();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    /* نرسم بضعف المقاس حتى يبقى حاداً على الشاشات عالية الكثافة. */
    renderQrDataUrl({ value, size: size * 2 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-xl bg-sand-100 text-xs text-basalt-600/70",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {t("admin.qrGenerateFailed")}
      </div>
    );
  }

  return (
    <div
      className={cn("overflow-hidden rounded-xl bg-white", className)}
      style={{ width: size, height: size }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="رمز QR"
          width={size}
          height={size}
          className="size-full"
        />
      ) : (
        <div className="size-full animate-pulse bg-sand-200/70" />
      )}
    </div>
  );
}
