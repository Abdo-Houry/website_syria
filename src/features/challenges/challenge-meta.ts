import { Camera, Compass, HelpCircle, MapPin, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/i18n/locale-context";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { Challenge, ChallengeType } from "@/types/api";
import type { MessageKey } from "@/i18n/messages/ar";

/**
 * خيارات الإجابة باللغة المطلوبة.
 *
 * الخيارات العربية في `options`، وترجمتها تُخزَّن في
 * `translations[locale].options` سطراً لكل خيار بالترتيب نفسه. إن لم يطابق
 * عدد الأسطر عدد الخيارات نعود إلى العربية حتى لا تختلّ المطابقة مع الخادم.
 * تُعيد أزواجاً (القيمة المرسلة للخادم، النص المعروض).
 */
export function challengeOptions(
  challenge: Challenge,
  locale: Locale,
): { value: string; label: string }[] {
  const base = challenge.options ?? [];
  if (!base.length) return [];

  let labels = base;
  if (locale !== DEFAULT_LOCALE) {
    const raw = challenge.translations?.[locale]?.options;
    const translated = (raw ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (translated.length === base.length) labels = translated;
  }

  return base.map((value, index) => ({ value, label: labels[index] ?? value }));
}

const TYPE_META: Record<string, { key: MessageKey; icon: LucideIcon }> = {
  question: { key: "challenges.typeQuestion", icon: HelpCircle },
  visit: { key: "challenges.typeVisit", icon: MapPin },
  photo: { key: "challenges.typePhoto", icon: Camera },
  discovery: { key: "challenges.typeDiscovery", icon: Compass },
};

/**
 * تسمية وأيقونة نوع التحدي.
 * الأنواع الأربعة موثّقة في تعليق `challenge.entity.ts` بالباك اند؛
 * أي نوع غيرها يظهر باسمه الخام مع أيقونة محايدة.
 */
export function useChallengeMeta() {
  const t = useT();

  return (type: ChallengeType): { label: string; icon: LucideIcon } => {
    const meta = TYPE_META[type];
    if (!meta) return { label: type, icon: Sparkles };
    return { label: t(meta.key), icon: meta.icon };
  };
}
