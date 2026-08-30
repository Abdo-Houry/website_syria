import { adminGet } from "@/lib/http";

/** الحقول مطابقة لـ AdminDashboardService.getStatistics */
export interface AdminStatistics {
  users: number;
  provinces: number;
  places: number;
  books: number;
  bookCopies: number;
  soldBooks: number;
  visits: number;
  completedChallenges: number;
  collectedStamps: number;
}

export const statisticsApi = {
  /** GET /api/admin/dashboard/statistics */
  get: () => adminGet<AdminStatistics>("/admin/dashboard/statistics"),
};
