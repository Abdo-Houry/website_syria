import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { CameraOff, Loader2, ScanLine, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

type CameraState =
  | "idle"
  | "starting"
  | "scanning"
  /** أُطفئت بعد مسح ناجح أو أثناء عرض رسالة — لا بثّ ولا انتظار. */
  | "stopped"
  | "denied"
  | "unavailable";

/**
 * ماسح QR يعتمد على كاميرا الجهاز.
 * يُستدعى `onResult` مرة واحدة لكل عملية مسح ناجحة ثم يتوقف البث.
 */
export function CameraScanner({
  onResult,
  className,
  paused,
}: {
  onResult: (text: string) => void;
  className?: string;
  /** إيقاف مؤقت أثناء معالجة نتيجة سابقة. */
  paused?: boolean;
}) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledRef = useRef(false);

  const [state, setState] = useState<CameraState>("idle");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const DENIED_MESSAGE = t("scanner.denied");
  const UNAVAILABLE_MESSAGE = t("scanner.unavailable");

  /*
    إطفاء الكاميرا فعلياً.

    `controls.stop()` وحده يوقف حلقة القراءة لكن قد يُبقي مسار الفيديو
    مفتوحاً — فيبقى مؤشّر الكاميرا مضاءً بعد نجاح المسح أو مغادرة الصفحة.
    لذلك نوقف كل مسارات البثّ صراحةً ونُفرغ `srcObject`.
  */
  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;

    stream?.getTracks().forEach((track) => track.stop());

    if (video) {
      video.srcObject = null;
    }

    setState("stopped");
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current) return;

    handledRef.current = false;
    setMessage(null);
    setState("starting");

    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      setMessage(UNAVAILABLE_MESSAGE);
      return;
    }

    try {
      /* طلب الإذن أولاً حتى تظهر أسماء الكاميرات في enumerateDevices */
      const probe = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      probe.getTracks().forEach((track) => track.stop());

      const available = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "videoinput",
      );
      setDevices(available);

      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 180,
        delayBetweenScanSuccess: 800,
      });

      const selected = available[deviceIndex] ?? available[0];

      controlsRef.current = await reader.decodeFromVideoDevice(
        selected?.deviceId,
        videoRef.current,
        (result) => {
          if (!result || handledRef.current) return;
          handledRef.current = true;
          /* الكاميرا تُطفأ فور القراءة — لا تبقى شغّالة بعد المسح. */
          stop();
          onResult(result.getText());
        },
      );

      setState("scanning");
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setState("denied");
        setMessage(DENIED_MESSAGE);
      } else {
        setState("unavailable");
        setMessage(UNAVAILABLE_MESSAGE);
      }
    }
  }, [deviceIndex, onResult, stop, DENIED_MESSAGE, UNAVAILABLE_MESSAGE]);

  useEffect(() => {
    if (paused) {
      stop();
      return;
    }
    void start();
    return stop;
  }, [start, stop, paused]);

  const isLive = state === "scanning";
  const hasProblem = state === "denied" || state === "unavailable";

  return (
    <div
      className={cn(
        "relative isolate aspect-square w-full overflow-hidden rounded-[var(--radius-xl2)] bg-basalt-950",
        className,
      )}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        className={cn(
          "size-full object-cover transition-opacity duration-500",
          isLive ? "opacity-100" : "opacity-0",
        )}
      />

      {/* إطار التوجيه */}
      {isLive ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="relative size-[62%]">
            <span className="absolute -start-1 -top-1 size-10 rounded-ss-2xl border-s-3 border-t-3 border-gold-400" />
            <span className="absolute -end-1 -top-1 size-10 rounded-se-2xl border-e-3 border-t-3 border-gold-400" />
            <span className="absolute -bottom-1 -start-1 size-10 rounded-es-2xl border-b-3 border-s-3 border-gold-400" />
            <span className="absolute -bottom-1 -end-1 size-10 rounded-ee-2xl border-b-3 border-e-3 border-gold-400" />
            <span className="absolute inset-x-4 top-1/2 h-0.5 animate-[scanline_2.4s_ease-in-out_infinite] rounded-full bg-gold-400/85 shadow-[0_0_14px_2px_rgba(217,164,65,0.55)]" />
          </div>
        </div>
      ) : null}

      {/* الكاميرا مطفأة — بعد مسح ناجح أو أثناء عرض رسالة */}
      {state === "stopped" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-white/10 text-sand-100/80">
            <CameraOff className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-medium text-sand-100/85">
            {t("scanner.cameraOff")}
          </p>
        </div>
      ) : null}

      {/* حالة التحميل */}
      {state === "starting" || state === "idle" ? (
        <div className="absolute inset-0 grid place-items-center gap-3 text-sand-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-7 animate-spin text-gold-400" aria-hidden />
            <p className="text-sm font-medium">{t("scanner.starting")}</p>
          </div>
        </div>
      ) : null}

      {/* حالة الرفض/عدم التوفر */}
      {hasProblem ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-clay-500/20 text-clay-400">
            <CameraOff className="size-6" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-sand-100/90">{message}</p>
          <Button variant="gold" size="sm" onClick={() => void start()}>
            <ScanLine />
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      {/* تبديل الكاميرا */}
      {isLive && devices.length > 1 ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={t("scanner.switchCamera")}
          onClick={() => setDeviceIndex((index) => (index + 1) % devices.length)}
          className="absolute end-3 top-3 border-white/25 bg-basalt-950/55 text-sand-50 hover:bg-basalt-950/75"
        >
          <SwitchCamera />
        </Button>
      ) : null}
    </div>
  );
}
