import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "@/lib/http";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // لا فائدة من إعادة المحاولة على أخطاء المصادقة أو المحتوى غير الموجود
        if (error instanceof ApiRequestError) {
          if (error.status === 401 || error.status === 403 || error.status === 404) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});

/** مفاتيح الاستعلامات — مُجمّعة لتسهيل الإبطال بعد المسح أو الحل. */
export const queryKeys = {
  profile: ["profile"] as const,
  userBooks: ["user-books"] as const,
  book: (id: number) => ["book", id] as const,
  province: (id: number) => ["province", id] as const,
  place: (id: number) => ["place", id] as const,
  /* تقدّم المستخدم مفهرس على نسخة الكتيّب — رحلة مستقلة لكل كتيّب */
  visits: (userBookId?: number) => ["visits", userBookId ?? null] as const,
  myChallenges: (userBookId?: number) =>
    ["my-challenges", userBookId ?? null] as const,
  myStamps: (userBookId?: number) => ["my-stamps", userBookId ?? null] as const,
  partners: ["partners"] as const,
  faqs: ["faqs"] as const,
  journey: (userBookId: number) => ["journey", userBookId] as const,
};

/** يُستدعى بعد أي حدث يغيّر تقدّم المستخدم (مسح QR، حل تحدٍّ، جمع طابع). */
export async function invalidateProgress(userBookId?: number) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["visits"] }),
    queryClient.invalidateQueries({ queryKey: ["my-challenges"] }),
    queryClient.invalidateQueries({ queryKey: ["my-stamps"] }),
    userBookId
      ? queryClient.invalidateQueries({ queryKey: queryKeys.journey(userBookId) })
      : Promise.resolve(),
  ]);
}
