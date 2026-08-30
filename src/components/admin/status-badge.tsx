import { CircleCheck, CircleSlash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/i18n/locale-context";

/** حالة النشر — العمود `status` منطقي في كل كيانات المحتوى. */
export function StatusBadge({ active }: { active: boolean }) {
  const t = useT();

  return active ? (
    <Badge variant="success">
      <CircleCheck />
      {t("common.published")}
    </Badge>
  ) : (
    <Badge variant="neutral">
      <CircleSlash />
      {t("common.hidden")}
    </Badge>
  );
}
