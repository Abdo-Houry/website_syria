import { apiGet } from "@/lib/http";
import type { Place } from "@/types/api";

export const placesApi = {
  /** GET /api/places */
  list: () => apiGet<Place[]>("/places", undefined, []),

  /** GET /api/places/:id — يعيد الصور والفيديوهات والمحافظة */
  byId: (id: number) => apiGet<Place>(`/places/${id}`),
};
