import { apiGet, apiPost } from "@/lib/http";
import type { UserBook } from "@/types/api";

/**
 * POST /api/users/books — تفعيل نسخة كتيّب وربطها بالحساب.
 *
 * الباك اند يقبل إحدى صيغتين (validations/user-book.validation.ts):
 *  - `bookCopyId` للإدخال اليدوي
 *  - `serial` + `version` وهما ما يحمله رمز الـ QR فعلياً
 */
export type ActivatePayload =
  | { bookCopyId: number }
  | { serial: string; version: string };

export const userBooksApi = {
  /** GET /api/users/books — كتيّبات المستخدم مع نسخته وكتابه */
  mine: () => apiGet<UserBook[]>("/users/books", undefined, []),

  activate: (payload: ActivatePayload) =>
    apiPost<UserBook>("/users/books", payload),
};
