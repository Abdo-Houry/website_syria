import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { adminAuthApi, type AdminAccount } from "@/api/admin/admin-auth.api";
import { queryClient } from "@/app/query-client";
import {
  ApiRequestError,
  getAdminToken,
  setAdminToken,
  setAdminUnauthorizedHandler,
} from "@/lib/http";

export type AdminStatus = "loading" | "authenticated" | "guest";

interface AdminAuthContextValue {
  status: AdminStatus;
  admin: AdminAccount | null;
  /**
   * تُستدعى بعد نجاح الدخول الموحّد بدور ADMIN.
   * صفحة الدخول واحدة للجميع، والدور هو ما يحدّد الجلسة التي تُفتح.
   */
  applySession: (admin: AdminAccount, token: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/** يزيل كل استعلامات لوحة الإدارة دون المساس بذاكرة تجربة المستخدم. */
function clearAdminQueries() {
  queryClient.removeQueries({
    predicate: (query) => String(query.queryKey[0]).startsWith("admin"),
  });
}

/**
 * جلسة المشرف مستقلة تماماً عن جلسة المستخدم: توكن منفصل في التخزين
 * ومعالج 401 منفصل، فيمكن فتح التجربتين في المتصفح نفسه دون تعارض.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AdminStatus>(() =>
    getAdminToken() ? "loading" : "guest",
  );
  const [admin, setAdmin] = useState<AdminAccount | null>(null);

  useEffect(() => {
    setAdminUnauthorizedHandler(() => {
      setAdminToken(null);
      setAdmin(null);
      setStatus("guest");
      clearAdminQueries();
    });
    return () => setAdminUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!getAdminToken()) {
      setStatus("guest");
      return;
    }

    (async () => {
      try {
        const profile = await adminAuthApi.profile();
        if (cancelled) return;
        setAdmin(profile);
        setStatus("authenticated");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiRequestError && error.isNetworkError) {
          setStatus("authenticated");
          return;
        }
        setAdminToken(null);
        setAdmin(null);
        setStatus("guest");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((account: AdminAccount, token: string) => {
    setAdminToken(token);
    setAdmin(account);
    setStatus("authenticated");
    clearAdminQueries();
  }, []);

  const logout = useCallback(() => {
    setAdminToken(null);
    setAdmin(null);
    setStatus("guest");
    clearAdminQueries();
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ status, admin, applySession, logout }),
    [status, admin, applySession, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  }
  return context;
}
