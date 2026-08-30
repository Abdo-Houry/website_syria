import { apiGet } from "@/lib/http";
import type { UserVisit } from "@/types/api";

export const visitsApi = {
  /**
   * GET /api/users/visits?userBookId=
   * بتمرير نسخة الكتيّب يعيد الخادم زيارات هذه الرحلة وحدها.
   */
  mine: (userBookId?: number) =>
    apiGet<UserVisit[]>(
      "/users/visits",
      userBookId ? { userBookId } : undefined,
      [],
    ),
};
