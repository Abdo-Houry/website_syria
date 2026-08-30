import { apiGet } from "@/lib/http";
import type { Partner } from "@/types/api";

export const partnersApi = {
  /** GET /api/partners */
  list: () => apiGet<Partner[]>("/partners", undefined, []),

  /** GET /api/partners/:id */
  byId: (id: number) => apiGet<Partner>(`/partners/${id}`),
};
