import { apiGet } from "@/lib/http";
import type { Province } from "@/types/api";


export const provincesApi = {
  /** GET /api/provinces */
  list: () => apiGet<Province[]>("/provinces", undefined, []),

  /** GET /api/provinces/:id — يعيد الصور والفيديوهات */
  byId: (id: number) => apiGet<Province>(`/provinces/${id}`),
};
