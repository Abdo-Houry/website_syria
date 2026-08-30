import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * كل انتقال إلى صفحة جديدة يبدأ من أعلاها.
 *
 * المتصفّح يحفظ موضع التمرير لكل مدخل في السجل، لذلك نُطفئ الاستعادة
 * التلقائية ونتحكّم بها هنا: التنقّل الأمامي (PUSH/REPLACE) يعود إلى
 * الأعلى، أمّا الرجوع بزرّ المتصفّح (POP) فيُترك للمتصفّح ليعيد المستخدم
 * إلى حيث كان — وهو ما يتوقّعه فعلاً عند الرجوع.
 *
 * تغيّر الـ query وحده لا يُعدّ انتقالاً: تبديل مرشِّح داخل الصفحة يجب
 * ألّا يقفز بالمستخدم إلى أعلاها.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, navigationType]);

  return null;
}
