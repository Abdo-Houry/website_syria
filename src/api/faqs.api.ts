import { apiGet } from "@/lib/http";
import type { Faq } from "@/types/api";

export const faqsApi = {
  /** GET /api/faqs */
  list: () => apiGet<Faq[]>("/faqs", undefined, []),
};
