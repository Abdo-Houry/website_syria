import { adminGet, adminPost, adminPut } from "@/lib/http";

export interface AdminAccount {
  id: number;
  username: string;
}

export interface AdminLoginResult {
  admin: AdminAccount;
  token: string;
}

export const adminAuthApi = {
  /** POST /api/admin/login — validations/admin.validation.ts */
  login: (username: string, password: string) =>
    adminPost<AdminLoginResult>("/admin/login", { username, password }),

  /** GET /api/admin/profile — {id, username} */
  profile: () => adminGet<AdminAccount>("/admin/profile"),

  /**
   * PUT /api/admin/profile — تغيير الاسم و/أو كلمة المرور.
   * يعيد توكناً جديداً لأن التوكن يحمل اسم المستخدم.
   */
  updateProfile: (payload: UpdateAdminProfilePayload) =>
    adminPut<AdminLoginResult>("/admin/profile", payload),
};

export interface UpdateAdminProfilePayload {
  username?: string;
  currentPassword: string;
  newPassword?: string;
}
