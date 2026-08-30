import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  type RegisterPayload,
  type RegisterResult,
} from "@/api/auth.api";
import { profileApi, type UpdateProfilePayload } from "@/api/profile.api";
import { queryClient, queryKeys } from "@/app/query-client";
import {
  ApiRequestError,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from "@/lib/http";
import type { UserProfile } from "@/types/api";

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  status: AuthStatus;
  user: UserProfile | null;
  /**
   * الملف الشخصي يُعدّ ناقصاً عندما لا يوجد بريد إلكتروني —
   * وهو الحقل الاختياري الوحيد في `registerUserSchema` بالباك اند.
   */
  needsProfileCompletion: boolean;
  /**
   * تُستدعى بعد نجاح الدخول الموحّد بدور USER — تخزّن التوكن وتجلب الملف.
   * الدخول نفسه يتم في صفحة واحدة مشتركة بين المستخدم والمشرف.
   */
  signInWithToken: (token: string) => Promise<UserProfile>;
  /**
   * التسجيل لا يفتح جلسة — الخادم يرسل رمز تحقّق إلى البريد. الجلسة تُفتح
   * بعد تأكيد الرمز عبر `signInWithToken`.
   */
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    getToken() ? "loading" : "guest",
  );
  const [user, setUser] = useState<UserProfile | null>(null);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus("guest");
    queryClient.clear();
  }, []);

  /* أي استجابة 401 من الباك اند تنهي الجلسة فوراً. */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      setStatus("guest");
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  /* استعادة الجلسة عند فتح التطبيق. */
  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      setStatus("guest");
      return;
    }

    (async () => {
      try {
        const profile = await profileApi.me();
        if (cancelled) return;
        setUser(profile);
        setStatus("authenticated");
      } catch (error) {
        if (cancelled) return;
        // الشبكة قد تكون متوقفة — نُبقي التوكن ولا نُخرج المستخدم إلا عند 401
        if (error instanceof ApiRequestError && error.isNetworkError) {
          setStatus("authenticated");
          return;
        }
        setToken(null);
        setUser(null);
        setStatus("guest");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const finishAuth = useCallback(async (token: string) => {
    setToken(token);
    // نجلب الملف الكامل لأن استجابة تسجيل الدخول تعيد {id,name,phone} فقط
    const profile = await profileApi.me();
    setUser(profile);
    setStatus("authenticated");
    queryClient.setQueryData(queryKeys.profile, profile);
    return profile;
  }, []);

  const signInWithToken = useCallback(
    (token: string) => finishAuth(token),
    [finishAuth],
  );

  const register = useCallback(
    (payload: RegisterPayload) => authApi.register(payload),
    [],
  );

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const updated = await profileApi.update(payload);
    // PUT يعيد الكيان كاملاً بما فيه كلمة المرور المشفّرة — نأخذ الحقول الآمنة فقط
    setUser((current) =>
      current
        ? {
            ...current,
            name: updated.name ?? current.name,
            phone: updated.phone ?? current.phone,
            email: updated.email ?? current.email,
            image: updated.image ?? current.image,
          }
        : current,
    );
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    return updated;
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await profileApi.me();
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      needsProfileCompletion: status === "authenticated" && !!user && !user.email,
      signInWithToken,
      register,
      updateProfile,
      refreshProfile,
      logout: clearSession,
    }),
    [
      status,
      user,
      signInWithToken,
      register,
      updateProfile,
      refreshProfile,
      clearSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
