import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * شعار المشروع — «صك».
 *
 * الأصل صورة العلامة نفسها (public/brand/sak-logo.png) بعد إزالة الخلفية
 * السوداء، فبقي شكل الكلمة وحده بقناة شفافية.
 *
 * تُعرض عبر `mask-image` لا عبر `<img>`: القناع يجعل الكلمة تأخذ لون النص
 * المحيط بها، فتظهر ذهبية على الخلفيات الداكنة وداكنة على الفاتحة من مصدر
 * واحد، بدل الاحتفاظ بنسخة ملوّنة لكل خلفية.
 */

export const BRAND_WORD = "صك";

/** مسار العلامة — يُستعمل أيضاً عند رسمها على canvas في رموز الـ QR. */
export const BRAND_LOGO_SRC = "/brand/sak-logo.png";

/**
 * الشعار الكامل: الكلمة مع خريطة سوريا المنقّطة وسطر «فن صناعة الذكريات».
 *
 * يُعرض كصورة بألوانه الأصلية لا كقناع — القناع يصلح للكلمة وحدها لأنها
 * لون واحد، أمّا اللوحة الكاملة فتفقد الخريطة والسطر السفلي إن صُبغت
 * بلون واحد. تُستعمل حيث تتّسع المساحة (صفحات الدخول وشاشة الانتظار)،
 * وتبقى `BrandMark` للمواضع الضيّقة كالشريط العلوي.
 *
 * نسختان مقصوصتان بخلفية شفّافة، مشتقّتان من `public/logo_Login.jpg`
 * (الأصل بخلفية سوداء مصمتة): الأولى بألوانها الأصلية والكلمة فيها داكنة
 * فتصلح للخلفيات الفاتحة، والثانية كلمتها ذهبية للخلفيات الداكنة — فالكلمة
 * الداكنة تختفي على الأخضر الداكن.
 */
export const BRAND_LOCKUP_SRC = "/brand/sak-logo-full.png";
export const BRAND_LOCKUP_DARK_SRC = "/brand/sak-logo-full-dark.png";

/** أبعاد العلامة الأصلية بعد القصّ — تحافظ على النِّسبة عند أي ارتفاع. */
export const BRAND_LOGO_WIDTH = 1084;
export const BRAND_LOGO_HEIGHT = 408;

/** لون العلامة في الملف الأصلي. */
export const BRAND_COLOR = "#323f2d";

const maskStyle: React.CSSProperties = {
  aspectRatio: `${BRAND_LOGO_WIDTH} / ${BRAND_LOGO_HEIGHT}`,
  maskImage: `url(${BRAND_LOGO_SRC})`,
  WebkitMaskImage: `url(${BRAND_LOGO_SRC})`,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
  maskSize: "contain",
  WebkitMaskSize: "contain",
};

/**
 * الكلمة وحدها، بلون النص المحيط.
 * يُضبط مقاسها بالارتفاع فقط (`className="h-7"`) والعرض يتبع النسبة.
 */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label={BRAND_WORD}
      className={cn("inline-block h-6 bg-current", className)}
      style={maskStyle}
    />
  );
}

/**
 * الشعار الكامل كصورة.
 *
 * إن لم يكن الملف موجوداً بعد نعود إلى الكلمة وحدها بدل إظهار صورة
 * مكسورة — فالواجهة تعمل قبل رفع الأصل وبعده.
 */
export function BrandLockup({
  className,
  fallbackClassName,
  on = "light",
}: {
  className?: string;
  /** لون الكلمة عند غياب ملف الشعار الكامل. */
  fallbackClassName?: string;
  /** لون الخلفية التي يجلس عليها الشعار — يحدّد أيّ نسخة تُستعمل. */
  on?: "light" | "dark";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <BrandWordmark className={cn(fallbackClassName, className)} />;
  }

  return (
    <img
      src={on === "dark" ? BRAND_LOCKUP_DARK_SRC : BRAND_LOCKUP_SRC}
      alt={BRAND_WORD}
      onError={() => setFailed(true)}
      className={cn("h-16 w-auto object-contain", className)}
    />
  );
}

type Tone = "dark" | "gold" | "light";

const TONES: Record<Tone, string> = {
  /* لوح داكن وكلمة ذهبية — على الخلفيات الفاتحة */
  dark: "bg-basalt-900 text-gold-400",
  /* لوح ذهبي وكلمة داكنة — على الخلفيات الداكنة */
  gold: "bg-gold-500 text-basalt-950",
  /* لوح رملي وكلمة بلون العلامة الأصلي */
  light: "bg-sand-50 text-[#323f2d]",
};

/**
 * العلامة داخل لوح بزوايا دائرية — حيث يحتاج الشعار حضوراً أوضح
 * (الشريط العلوي، لوحة الإدارة، شاشة الانتظار).
 */
export function BrandMark({
  className,
  tone = "dark",
  wordmarkClassName,
}: {
  className?: string;
  tone?: Tone;
  wordmarkClassName?: string;
}) {
  return (
    <span
      className={cn(
        "grid h-9 shrink-0 place-items-center rounded-xl px-2",
        TONES[tone],
        className,
      )}
    >
      <BrandWordmark className={cn("h-3.5", wordmarkClassName)} />
    </span>
  );
}
