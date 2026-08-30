import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { LOCALE_META } from "@/i18n/config";
import { flagImageUrl } from "@/lib/country-codes";
import { cn } from "@/lib/utils";

/*
   الأعلام مرسومة كـ SVG لا كإيموجي.

   السبب المباشر: إيموجي 🇸🇾 يعرض علم سوريا القديم في كل خطوط الأنظمة،
   ولا يوجد رمز إيموجي للعلم الجديد بعد. ورسمها يدوياً يضمن أيضاً
   شكلاً وحجماً موحّدين عبر ويندوز وأندرويد وiOS.
*/

/** نجمة خماسية بنصف قطر 1، مركزها نقطة الأصل. */
const STAR =
  "M0,-1L.2245,-.309L.9511,-.309L.3633,.118L.5878,.809L0,.382L-.5878,.809L-.3633,.118L-.9511,-.309L-.2245,-.309Z";

function SyriaFlag() {
  /*
     علم الجمهورية العربية السورية الحالي (علم الاستقلال):
     أخضر / أبيض / أسود، وثلاث نجمات حمراء في الوسط.
  */
  return (
    <>
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.334" fill="#007a3d" />
      <rect y="10.666" width="24" height="5.334" fill="#000" />
      <g fill="#ce1126">
        <path d={STAR} transform="translate(6 8) scale(1.75)" />
        <path d={STAR} transform="translate(12 8) scale(1.75)" />
        <path d={STAR} transform="translate(18 8) scale(1.75)" />
      </g>
    </>
  );
}

function GermanyFlag() {
  return (
    <>
      <rect width="24" height="5.334" fill="#000" />
      <rect y="5.334" width="24" height="5.333" fill="#dd0000" />
      <rect y="10.666" width="24" height="5.334" fill="#ffce00" />
    </>
  );
}

function TurkeyFlag() {
  return (
    <>
      <rect width="24" height="16" fill="#e30a17" />
      {/* الهلال: دائرة بيضاء تقتطعها دائرة حمراء أصغر */}
      <circle cx="9.4" cy="8" r="4" fill="#fff" />
      <circle cx="10.8" cy="8" r="3.2" fill="#e30a17" />
      <path d={STAR} transform="translate(15.1 8) rotate(15) scale(2)" fill="#fff" />
    </>
  );
}

function UnitedKingdomFlag() {
  return (
    <>
      <rect width="24" height="16" fill="#012169" />
      <g clipPath="url(#uk-clip)">
        {/* الأقطار البيضاء ثم الحمراء فوقها */}
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="3.2" />
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#c8102e" strokeWidth="1.9" />
      </g>
      {/* الصليب الأبيض ثم الأحمر */}
      <path d="M12,0 V16 M0,8 H24" stroke="#fff" strokeWidth="5.3" />
      <path d="M12,0 V16 M0,8 H24" stroke="#c8102e" strokeWidth="3.2" />
      <defs>
        <clipPath id="uk-clip">
          <rect width="24" height="16" />
        </clipPath>
      </defs>
    </>
  );
}

const FLAGS: Record<Locale, () => JSX.Element> = {
  ar: SyriaFlag,
  en: UnitedKingdomFlag,
  de: GermanyFlag,
  tr: TurkeyFlag,
};

/** علم صغير يمثّل لغة الواجهة. */
export function FlagIcon({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const Flag = FLAGS[locale];

  return (
    <svg
      viewBox="0 0 24 16"
      role="img"
      aria-label={LOCALE_META[locale].englishLabel}
      className={cn(
        "h-3.5 w-5 shrink-0 rounded-[2px] ring-1 ring-inset ring-black/15",
        className,
      )}
    >
      <Flag />
    </svg>
  );
}

/*
   علم أي دولة في العالم — لحقل الهاتف.

   الأعلام تُجلب كصور من flagcdn: هي الطريقة الوحيدة لعرض علم حقيقي على
   ويندوز، حيث لا يرسم النظام إيموجي الأعلام إطلاقاً. سوريا وحدها تُرسم
   محلياً لأن المصادر العامة ما زالت تعرض العلم القديم.

   تعذُّر تحميل الصورة (بلا إنترنت مثلاً) يُظهر رمز الدولة نصّاً بدل مربّع
   فارغ، فيبقى الاختيار مفهوماً.
*/

export function CountryFlag({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  const shape = cn(
    "h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-inset ring-black/15",
    className,
  );

  if (iso === "SY") {
    return (
      <svg viewBox="0 0 24 16" role="img" aria-label="Syria" className={shape}>
        <SyriaFlag />
      </svg>
    );
  }

  if (failed) {
    return (
      <span
        aria-hidden
        className={cn(
          shape,
          "grid place-items-center bg-sand-100 text-[8px] font-bold leading-none text-basalt-700",
        )}
      >
        {iso}
      </span>
    );
  }

  return (
    <img
      src={flagImageUrl(iso)}
      srcSet={flagImageUrl(iso, 40) + " 1x, " + flagImageUrl(iso, 80) + " 2x"}
      alt=""
      loading="lazy"
      decoding="async"
      width={20}
      height={14}
      onError={() => setFailed(true)}
      className={shape}
    />
  );
}
