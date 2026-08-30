import { apiGet } from "@/lib/http";
import type { UserDashboard } from "@/types/api";

export const journeyApi = {
  /**
   * GET /api/users/dashboard/:userBookId
   * إحصاءات الرحلة الخاصة بنسخة كتيّب واحدة — مصدر عزل التقدّم بين الكتيّبات.
   */
  byUserBook: (userBookId: number) =>
    apiGet<UserDashboard>(`/users/dashboard/${userBookId}`),
};
