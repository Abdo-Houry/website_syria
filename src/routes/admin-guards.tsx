import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Splash } from "@/components/layout/splash";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useT } from "@/i18n/locale-context";

/** يمنع الوصول إلى لوحة الإدارة قبل دخول المشرف. */
export function RequireAdmin() {
  const { status } = useAdminAuth();
  const location = useLocation();
  const t = useT();

  if (status === "loading") return <Splash label={t("state.checkingAccess")} />;

  if (status === "guest") {
    /* الدخول موحّد — نرسله إلى صفحة الدخول العامة ونعيده بعدها. */
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
