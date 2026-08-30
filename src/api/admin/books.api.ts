import { adminDelete, adminGet, adminPost, adminPut } from "@/lib/http";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type { Book, BookCopy, QrCode } from "@/types/api";

/** POST /api/admin/books — validations/admin-book.validation.ts */
export interface AdminBookInput {
  name: string;
  description?: string;
  provinceId: number;
  places: number[];
  challenges: number[];
  stamps: number[];
  partners: number[];
  translations?: EntityTranslations;
}

export const adminBooksApi = {
  /** GET /api/admin/books — يعيد المحافظة والمحتوى والنسخ */
  list: () => adminGet<Book[]>("/admin/books", undefined, []),

  /** GET /api/admin/books/:id */
  byId: (id: number) => adminGet<Book>(`/admin/books/${id}`),

  create: (data: AdminBookInput) => adminPost<Book>("/admin/books", data),

  /*
    PUT /api/admin/books/:id — تعديل الجواز.

    النسخ المطبوعة ترتبط بالجواز نفسه، فالتعديل يظهر في كل نسخة مرتبطة
    به فوراً دون إعادة إنشاء أي رمز.
  */
  update: (id: number, data: Partial<AdminBookInput>) =>
    adminPut<Book>(`/admin/books/${id}`, data),

  remove: (id: number) => adminDelete<null>(`/admin/books/${id}`, null),
};

/** POST /api/book-copies — إنشاء النسخة يولّد رموز الـ QR تلقائياً */
export interface BookCopyInput {
  bookId: number;
  serial_number: string;
  version: string;
}

export const adminBookCopiesApi = {
  /** GET /api/book-copies */
  list: () => adminGet<BookCopy[]>("/book-copies", undefined, []),

  /** GET /api/book-copies/book/:bookId */
  byBook: (bookId: number) =>
    adminGet<BookCopy[]>(`/book-copies/book/${bookId}`, undefined, []),

  /** GET /api/book-copies/:id — يعيد النسخة مع رموزها */
  byId: (id: number) => adminGet<BookCopy>(`/book-copies/${id}`),

  create: (data: BookCopyInput) => adminPost<BookCopy>("/book-copies", data),

  remove: (id: number) => adminDelete<null>(`/book-copies/${id}`, null),
};

export const adminQrCodesApi = {
  /** GET /api/qr-codes — كل الرموز مع نسخها وكتبها */
  list: () => adminGet<QrCode[]>("/qr-codes", undefined, []),
};
