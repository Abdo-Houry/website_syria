import { Percent, Store } from "lucide-react";
import { SmartImage } from "@/components/common/smart-image";
import { Badge } from "@/components/ui/badge";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField, tFieldOptional } from "@/i18n/translate-entity";
import type { Partner } from "@/types/api";

/** يعيد بوستجرس حقول decimal كنصوص — نطبّعها هنا. */
function discountValue(value: Partner["discount_percentage"]): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function PartnerCard({ partner }: { partner: Partner }) {
  const t = useT();
  const { locale } = useLocale();

  const discount = discountValue(partner.discount_percentage);
  const name = tField(partner, "name", locale);
  const description = tFieldOptional(partner, "description", locale);

  return (
    <article className="group flex gap-4 overflow-hidden rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white p-4 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-sand-100 sm:size-24">
        <SmartImage
          src={partner.image_url}
          alt={name}
          wrapperClassName="size-full"
          className="transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-bold text-basalt-900">{name}</h3>
          {discount > 0 ? (
            <Badge variant="gold">
              <Percent />
              {t("partners.discount", { value: discount })}
            </Badge>
          ) : (
            <Badge variant="neutral">
              <Store />
              {t("partners.badge")}
            </Badge>
          )}
        </div>

        {description ? (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-basalt-600/85">
            {description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
