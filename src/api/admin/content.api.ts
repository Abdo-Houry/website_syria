import { adminDelete, adminGet, adminPost, adminPut, adminUpload } from "@/lib/http";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type {
  Area,
  Challenge,
  Faq,
  Partner,
  Place,
  Province,
  Stamp,
} from "@/types/api";

/* ------------------------------------------------------------------ */
/* المحافظات — /api/provinces                                          */
/* ------------------------------------------------------------------ */

export interface ProvinceInput {
  name: string;
  summary?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  translations?: EntityTranslations;
}

export const adminProvincesApi = {
  list: () => adminGet<Province[]>("/provinces", undefined, []),
  byId: (id: number) => adminGet<Province>(`/provinces/${id}`),
  create: (data: ProvinceInput) => adminPost<Province>("/provinces", data),
  update: (id: number, data: Partial<ProvinceInput> & { status?: boolean }) =>
    adminPut<Province>(`/provinces/${id}`, data),
  remove: (id: number) => adminDelete<null>(`/provinces/${id}`, null),

  /** POST /api/provinces/media/:id/images — الحقل اسمه `images` (multer) */
  uploadImages: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return adminUpload<unknown>(`/provinces/media/${id}/images`, form);
  },

  /** POST /api/provinces/media/:id/videos — الحقل اسمه `videos` */
  uploadVideos: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("videos", file));
    return adminUpload<unknown>(`/provinces/media/${id}/videos`, form);
  },

  deleteImage: (imageId: number) =>
    adminDelete<null>(`/provinces/media/images/${imageId}`, null),

  deleteVideo: (videoId: number) =>
    adminDelete<null>(`/provinces/media/videos/${videoId}`, null),
};

/* ------------------------------------------------------------------ */
/* الأماكن — /api/places                                               */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* المناطق — /api/areas                                                */
/* ------------------------------------------------------------------ */

export interface AreaInput {
  provinceId: number;
  name: string;
  description?: string;
  translations?: EntityTranslations;
}

export const adminAreasApi = {
  list: () => adminGet<Area[]>("/areas", undefined, []),
  byId: (id: number) => adminGet<Area>(`/areas/${id}`),
  create: (data: AreaInput) => adminPost<Area>("/areas", data),
  update: (id: number, data: Partial<AreaInput> & { status?: boolean }) =>
    adminPut<Area>(`/areas/${id}`, data),
  remove: (id: number) => adminDelete<null>(`/areas/${id}`, null),
};

export interface PlaceInput {
  provinceId: number;
  /** المنطقة — `null` يزيل الربط، وغيابه يبقيه كما هو */
  areaId?: number | null;
  name: string;
  summary?: string;
  description?: string;
  visit_info?: string;
  latitude?: number;
  longitude?: number;
  /** مكان استكشاف — تفاصيل ووسائط وموقع فقط، بلا تحديات ولا طوابع ولا QR */
  isExploration?: boolean;
  translations?: EntityTranslations;
}

export const adminPlacesApi = {
  list: () => adminGet<Place[]>("/places", undefined, []),
  byId: (id: number) => adminGet<Place>(`/places/${id}`),
  create: (data: PlaceInput) => adminPost<Place>("/places", data),
  /** التعديل لا يقبل provinceId — راجع updatePlaceSchema */
  update: (
    id: number,
    data: Omit<Partial<PlaceInput>, "provinceId"> & { status?: boolean },
  ) => adminPut<Place>(`/places/${id}`, data),
  remove: (id: number) => adminDelete<null>(`/places/${id}`, null),

  uploadImages: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return adminUpload<unknown>(`/places/media/${id}/images`, form);
  },

  uploadVideos: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("videos", file));
    return adminUpload<unknown>(`/places/media/${id}/videos`, form);
  },

  deleteImage: (imageId: number) =>
    adminDelete<null>(`/places/media/images/${imageId}`, null),

  deleteVideo: (videoId: number) =>
    adminDelete<null>(`/places/media/videos/${videoId}`, null),
};

/* ------------------------------------------------------------------ */
/* التحديات — /api/challenges                                          */
/* ------------------------------------------------------------------ */

export interface ChallengeInput {
  placeId: number;
  title: string;
  description?: string;
  type?: string;
  /** خيارات الإجابة (2–6) ودليل الصحيح منها */
  options: string[];
  correct_option: number;
  translations?: EntityTranslations;
}

export const adminChallengesApi = {
  list: () => adminGet<Challenge[]>("/challenges", undefined, []),
  create: (data: ChallengeInput) => adminPost<Challenge>("/challenges", data),
  update: (
    id: number,
    data: Omit<Partial<ChallengeInput>, "placeId"> & { status?: boolean },
  ) => adminPut<Challenge>(`/challenges/${id}`, data),
  remove: (id: number) => adminDelete<null>(`/challenges/${id}`, null),
};

/* ------------------------------------------------------------------ */
/* الطوابع — /api/stamps                                               */
/* ------------------------------------------------------------------ */

export interface StampInput {
  placeId: number;
  name: string;
  description?: string;
  image_url: string;
  translations?: EntityTranslations;
}

export const adminStampsApi = {
  list: () => adminGet<Stamp[]>("/stamps", undefined, []),
  create: (data: StampInput) => adminPost<Stamp>("/stamps", data),
  update: (
    id: number,
    data: Omit<Partial<StampInput>, "placeId"> & { status?: boolean },
  ) => adminPut<Stamp>(`/stamps/${id}`, data),
  remove: (id: number) => adminDelete<null>(`/stamps/${id}`, null),
};

/* ------------------------------------------------------------------ */
/* الشركاء — /api/partners                                             */
/* ------------------------------------------------------------------ */

export interface PartnerInput {
  name: string;
  description?: string;
  image_url: string;
  discount_percentage: number;
  translations?: EntityTranslations;
}

export const adminPartnersApi = {
  list: () => adminGet<Partner[]>("/partners", undefined, []),
  create: (data: PartnerInput) => adminPost<Partner>("/partners", data),
  update: (id: number, data: Partial<PartnerInput> & { status?: boolean }) =>
    adminPut<Partner>(`/partners/${id}`, data),
  remove: (id: number) => adminDelete<null>(`/partners/${id}`, null),
};

/* ------------------------------------------------------------------ */
/* الأسئلة الشائعة — /api/faqs                                         */
/* ------------------------------------------------------------------ */

export interface FaqInput {
  question: string;
  answer: string;
  translations?: EntityTranslations;
}

export const adminFaqsApi = {
  list: () => adminGet<Faq[]>("/faqs", undefined, []),
  create: (data: FaqInput) => adminPost<Faq>("/faqs", data),
  update: (id: number, data: Partial<FaqInput> & { status?: boolean }) =>
    adminPut<Faq>(`/faqs/${id}`, data),
  remove: (id: number) => adminDelete<null>(`/faqs/${id}`, null),
};
