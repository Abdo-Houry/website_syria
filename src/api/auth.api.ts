import { apiPost } from "@/lib/http";
import type { AuthResult, AuthUser } from "@/types/api";

/** POST /api/users/register — validations/user-auth.validation.ts */
export interface RegisterPayload {
  name: string;
  phone: string;
  /** إلزامي: قناة رمز التحقّق واستعادة كلمة المرور. */
  email: string;
  password: string;
}

/**
 * التسجيل لا يفتح جلسة: الخادم يرسل رمزاً إلى البريد ولا يُصدر توكن إلا
 * بعد تأكيده في `/users/verify-otp`.
 */
export interface RegisterResult {
  requiresVerification: true;
  email: string;
}

/**
 * POST /api/auth/login — دخول موحّد.
 * الباك اند يحدّد الدور من الحساب: اسم المستخدم ⇒ مشرف، رقم الهاتف ⇒ مستخدم.
 */
export type UnifiedLoginResult =
  | { role: "ADMIN"; admin: { id: number; username: string }; token: string }
  | { role: "USER"; user: AuthUser; token: string };

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiPost<RegisterResult>("/users/register", payload),

  login: (identifier: string, password: string) =>
    apiPost<UnifiedLoginResult>("/auth/login", { identifier, password }),

  /** تأكيد البريد بالرمز — يعيد الجلسة. */
  verifyOtp: (email: string, code: string) =>
    apiPost<AuthResult>("/users/verify-otp", { email, code }),

  resendOtp: (email: string) =>
    apiPost<{ email: string }>("/users/resend-otp", { email }, { email }),

  /** طلب رمز استعادة كلمة المرور. */
  forgotPassword: (email: string) =>
    apiPost<{ email: string }>("/users/forgot-password", { email }, { email }),

  /** تعيين كلمة مرور جديدة بالرمز — يعيد الجلسة. */
  resetPassword: (email: string, code: string, password: string) =>
    apiPost<AuthResult>("/users/reset-password", { email, code, password }),
};
