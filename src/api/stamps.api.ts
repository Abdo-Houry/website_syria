import { apiGet, apiPost } from "@/lib/http";
import type { Stamp, UserStamp } from "@/types/api";

export const stampsApi = {
  /** GET /api/stamps */
  list: () => apiGet<Stamp[]>("/stamps", undefined, []),

  /** GET /api/stamps/:id */
  byId: (id: number) => apiGet<Stamp>(`/stamps/${id}`),

  /** GET /api/users/stamps?userBookId= */
  mine: (userBookId?: number) =>
    apiGet<UserStamp[]>(
      "/users/stamps",
      userBookId ? { userBookId } : undefined,
      [],
    ),

  /** POST /api/users/stamps/collect */
  collect: (stampId: number, userBookId?: number) =>
    apiPost<UserStamp>("/users/stamps/collect", {
      stampId,
      ...(userBookId ? { userBookId } : {}),
    }),
};
