import { apiGet, apiPut } from "@/lib/http";
import type { UserProfile } from "@/types/api";

/** PUT /api/users/profile — كل الحقول اختيارية (updateProfileSchema) */
export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  email?: string;
  image?: string;
}

export const profileApi = {
  /** GET /api/users/profile */
  me: () => apiGet<UserProfile>("/users/profile"),

  /** PUT /api/users/profile */
  update: (payload: UpdateProfilePayload) =>
    apiPut<UserProfile>("/users/profile", payload),
};
