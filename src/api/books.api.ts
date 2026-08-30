import { apiGet } from "@/lib/http";
import type { Book } from "@/types/api";

/**
 * GET /api/books/:id — routes/book.routes.ts
 *
 * محميّ بـ `anyAuthMiddleware`، أي يقبل توكن المستخدم والمشرف معاً، لأنه
 * المصدر الوحيد الذي يعيد محتوى الكتيّب كاملاً (الأماكن والتحديات والطوابع
 * والشركاء). قائمة كل الكتيّبات `GET /api/books` للمشرف فقط ولا تستخدمها الواجهة.
 */
export const booksApi = {
  byId: (bookId: number) => apiGet<Book>(`/books/${bookId}`),
};
