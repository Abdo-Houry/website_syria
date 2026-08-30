import { adminGet } from "@/lib/http";
import type { AdminUserDetails, AdminUserRow } from "@/types/api";

export const adminUsersApi = {
  /** GET /api/admin/users — صف لكل مستخدم مع أعداد إنجازه. */
  list: () => adminGet<AdminUserRow[]>("/admin/users", undefined, []),

  /** GET /api/admin/users/:id — الكتيّبات التي يملكها وما أنجزه في كل منها. */
  byId: (id: number) => adminGet<AdminUserDetails>(`/admin/users/${id}`),
};
