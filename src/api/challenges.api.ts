import { apiGet, apiPost } from "@/lib/http";
import type { Challenge, UserChallenge } from "@/types/api";

export const challengesApi = {
  /** GET /api/challenges */
  list: () => apiGet<Challenge[]>("/challenges", undefined, []),

  /** GET /api/challenges/:id */
  byId: (id: number) => apiGet<Challenge>(`/challenges/${id}`),

  /**
   * GET /api/users/challenges?userBookId=
   * التصفية على مستوى الخادم تضمن عزل التقدّم بين الكتيّبات.
   */
  mine: (userBookId?: number) =>
    apiGet<UserChallenge[]>(
      "/users/challenges",
      userBookId ? { userBookId } : undefined,
      [],
    ),

  /** POST /api/users/challenges/solve */
  solve: (challengeId: number, answer: string, userBookId?: number) =>
    apiPost<UserChallenge>("/users/challenges/solve", {
      challengeId,
      answer,
      ...(userBookId ? { userBookId } : {}),
    }),
};
