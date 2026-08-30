import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { useT } from "@/i18n/locale-context";

/**
 * مكتبة فك ترميز الـ QR ثقيلة (~600KB)، ولا يحتاجها إلا صفحتا المسح والتفعيل.
 * لذلك نحمّلها عند الطلب فقط بدل إدراجها في الحزمة الأولى.
 */
const CameraScannerImpl = lazy(() =>
  import("@/components/scanner/camera-scanner").then((module) => ({
    default: module.CameraScanner,
  })),
);

export function CameraScanner(props: {
  onResult: (text: string) => void;
  className?: string;
  paused?: boolean;
}) {
  const t = useT();

  return (
    <Suspense
      fallback={
        <div className="grid aspect-square w-full place-items-center rounded-[var(--radius-xl2)] bg-basalt-950">
          <div className="flex flex-col items-center gap-3 text-sand-100">
            <Loader2 className="size-7 animate-spin text-gold-400" aria-hidden />
            <p className="text-sm font-medium">{t("scanner.loadingScanner")}</p>
          </div>
        </div>
      }
    >
      <CameraScannerImpl {...props} />
    </Suspense>
  );
}
