import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Splash } from "@/components/layout/splash";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useAuth } from "@/context/auth-context";
import { useJourney } from "@/context/journey-context";
import { isUserBookDeleted } from "@/features/books/booklet-card";
import { useT } from "@/i18n/locale-context";

/** يمنع الوصول إلى تجربة الرحلة قبل تسجيل الدخول. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Splash />;

  if (status === "guest") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}

/**
 * الرحلة تبدأ من الكتيّب: بدون كتيّب مفعّل لا معنى للأماكن أو التحديات،
 * لذلك نُعيد المستخدم إلى صفحة الكتيّبات.
 */
export function RequireBooklet() {
  const { userBooks, isLoadingBooks } = useJourney();
  const t = useT();

  if (isLoadingBooks) return <Splash label={t("state.loadingBooks")} />;

  /* النسخة المحذوفة تُعرض في القائمة لكنها لا تفتح رحلة. */
  if (!userBooks.some((item) => !isUserBookDeleted(item))) {
    return <Navigate to="/books" replace />;
  }

  return <Outlet />;
}

/**
 * يمنع ظهور صفحات الدخول لمن سجّل دخوله بالفعل.
 * الدخول موحّد، لذلك نتحقّق من الجلستين ونوجّه كلاً إلى مساحته.
 */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const { status: adminStatus } = useAdminAuth();

  if (status === "loading" || adminStatus === "loading") return <Splash />;

  if (adminStatus === "authenticated") return <Navigate to="/admin" replace />;
  if (status === "authenticated") return <Navigate to="/journey" replace />;

  return <Outlet />;
}
