import { useCallback } from "react";
import { useT } from "@/i18n/locale-context";
import { describeUnknownError } from "@/lib/http";

/**
 * نسخة الرسم من `toErrorMessage`.
 *
 * ترتبط بـ `t` مباشرة بدل المترجم المسجَّل عالمياً، فتُعاد ترجمة رسالة الخطأ
 * المعروضة في اللحظة نفسها التي يبدّل فيها المستخدم اللغة — لا في الطلب التالي.
 */
export function useErrorMessage() {
  const t = useT();

  return useCallback(
    (error: unknown): string => {
      const { key, text } = describeUnknownError(error);
      return key ? t(key) : (text ?? "");
    },
    [t],
  );
}
